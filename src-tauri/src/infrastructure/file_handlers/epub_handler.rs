use base64::{Engine as _, engine::general_purpose};
use rbook::Epub;
use regex::Regex;
use scraper::{Html, Selector};
use std::path::{Path, PathBuf};
use tokio::task::JoinError;
use walkdir::WalkDir;

use crate::infrastructure::database::database::connect_from_pool;
use crate::infrastructure::file_handlers::BookMetadata;
use crate::utils::file::compute_checksum;

/// Marker struct for EPUB-specific operations.
pub struct EpubHandler;

/// Recursively scans a directory for `.epub` files.
///
/// Runs directory traversal on a blocking thread to avoid stalling the async
/// runtime.
///
/// # Arguments
///
/// * `dir` - Directory to scan recursively.
///
/// # Returns
///
/// A vector of absolute paths to matching `.epub` files.
pub async fn scan_epubs<P: AsRef<Path> + Send + 'static>(
    dir: P,
) -> Result<Vec<PathBuf>, JoinError> {
    tokio::task::spawn_blocking(move || {
        WalkDir::new(dir)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_file())
            .map(|e| e.into_path())
            .filter(|p| {
                p.extension()
                    .and_then(|s| s.to_str())
                    .map(|ext| ext.eq_ignore_ascii_case("epub"))
                    .unwrap_or(false)
            })
            .collect()
    })
    .await
}

/// Parses metadata from an EPUB file.
///
/// Extracts title, authors, publishers, publication date, ISBN, cover image,
/// and computes a SHA-256 checksum. Defaults to "Unknown Author" / "Unknown
/// Publisher" / "Unknown Title" when metadata fields are missing.
///
/// # Arguments
///
/// * `path` - Absolute path to the EPUB file.
///
/// # Returns
///
/// A populated [`BookMetadata`] struct with all extracted fields and the
/// file's SHA-256 checksum.
///
/// # Errors
///
/// Returns a boxed error when the file cannot be opened, is not a valid EPUB,
/// or cannot be checksummed.
pub async fn parse_epub_meta(
    path: String,
) -> Result<BookMetadata, Box<dyn std::error::Error + Send + Sync>> {
    let checksum = compute_checksum(&path).await?;

    tokio::task::spawn_blocking(move || {
        let book = Epub::open(&path)?;
        let metadata = book.metadata();

        let title = metadata
            .title()
            .map(|t| t.value().to_string())
            .unwrap_or_else(|| "Unknown Title".to_string());

        let mut authors: Vec<String> = metadata.creators().map(|c| c.value().to_string()).collect();

        let mut publishers: Vec<String> = metadata
            .publishers()
            .map(|p| p.value().to_string())
            .collect::<Vec<String>>();

        if publishers.is_empty() {
            publishers.push("Unknown Publisher".to_string());
        }

        if authors.is_empty() {
            authors.push("Unknown Author".to_string());
        }

        let published_date = metadata.published().map(|d| d.to_string());

        let isbn = metadata
            .identifiers()
            .find(|i| i.value().starts_with("urn:isbn:"))
            .map(|i| i.value().to_string());

        let cover_data = if let Some(cover_image) = book.manifest().cover_image() {
            let mime_type = cover_image.kind().as_str().to_string();
            cover_image
                .read_bytes()
                .ok()
                .map(|bytes| (bytes, mime_type))
        } else {
            None
        };

        Ok(BookMetadata {
            title,
            authors,
            publishers,
            published_date,
            isbn,
            file_path: path,
            cover_data,
            checksum,
        })
    })
    .await?
}

/// Reads and concatenates the full HTML content of an EPUB file.
///
/// Iterates through the spine items, extracts `<body>` inner HTML, and
/// replaces relative image `src` attributes with inline base64 data URIs
/// so the resulting HTML is self-contained.
///
/// # Arguments
///
/// * `path` - Absolute path to the EPUB file.
///
/// # Returns
///
/// A single HTML string containing the concatenated body content of all
/// spine items, with embedded base64 images.
///
/// # Errors
///
/// Returns a boxed error when the file cannot be opened or any spine item
/// fails to parse.
pub async fn get_epub_content(
    path: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let path_str = path.to_string();
    tokio::task::spawn_blocking(move || {
        let epub = Epub::open(&path_str).map_err(|e| e.to_string())?;
        let mut combined_html = String::new();
        // TODO: Avoid using regex
        let img_re = Regex::new(r#"(?i)(<img[^>]*?src=["'])([^"']+)(["'][^>]*?>)"#).unwrap();
        let image_re =
            Regex::new(r#"(?i)(<image[^>]*?(?:xlink:)?href=["'])([^"']+)(["'][^>]*?>)"#).unwrap();

        let spine = epub.spine().iter().collect::<Vec<_>>();

        for item_ref in spine {
            if let Some(resource) = epub.manifest().by_id(item_ref.idref())
                && resource.kind().as_str() == "application/xhtml+xml"
                && let Ok(content) = epub.read_resource_str(resource.resource())
            {
                let content_img_processed =
                    img_re.replace_all(&content, |caps: &regex::Captures| {
                        let prefix = &caps[1];
                        let src = &caps[2];
                        let suffix = &caps[3];

                        if src.starts_with("data:") || src.starts_with("http") {
                            return caps[0].to_string();
                        }

                        let current_href = resource.href().as_str();
                        let resolved_href = resolve_path(current_href, src);

                        if let Some(image_resource) =
                            epub.manifest().by_href(&resolved_href)
                            && let Ok(image_bytes) = image_resource.read_bytes()
                        {
                            let encoded =
                                general_purpose::STANDARD.encode(&image_bytes);
                            let kind = image_resource.kind();
                            let mime_type = kind.as_str();
                            let data_url =
                                format!("data:{};base64,{}", mime_type, encoded);
                            return format!("{}{}{}", prefix, data_url, suffix);
                        }
                        caps[0].to_string()
                    });

                let content_final = image_re.replace_all(
                    &content_img_processed,
                    |caps: &regex::Captures| {
                        let prefix = &caps[1];
                        let src = &caps[2];
                        let suffix = &caps[3];

                        if src.starts_with("data:") || src.starts_with("http") {
                            return caps[0].to_string();
                        }

                        let current_href = resource.href().as_str();
                        let resolved_href = resolve_path(current_href, src);

                        if let Some(image_resource) =
                            epub.manifest().by_href(&resolved_href)
                            && let Ok(image_bytes) = image_resource.read_bytes()
                        {
                            let encoded =
                                general_purpose::STANDARD.encode(&image_bytes);
                            let kind = image_resource.kind();
                            let mime_type = kind.as_str();
                            let data_url =
                                format!("data:{};base64,{}", mime_type, encoded);
                            return format!("{}{}{}", prefix, data_url, suffix);
                        }
                        caps[0].to_string()
                    },
                );

                let document = Html::parse_document(&content_final);
                let body_selector = Selector::parse("body").unwrap();
                if let Some(body_node) = document.select(&body_selector).next() {
                    combined_html.push_str(&body_node.inner_html());
                }
            }
        }
        Ok(combined_html)
    })
    .await?
}

/// Resolves a relative image path against a base EPUB href.
///
/// Normalizes `..` components and converts backslashes to forward slashes
/// for cross-platform compatibility.
///
/// # Arguments
///
/// * `base_href` - The EPUB resource's `href` attribute (acts as base path).
/// * `relative_path` - The relative image path from an `src` attribute.
///
/// # Returns
///
/// The normalized, resolved path as a forward-slash-separated string.
fn resolve_path(base_href: &str, relative_path: &str) -> String {
    let resolved_path = if let Some(parent) = Path::new(base_href).parent() {
        let joined = parent.join(relative_path);
        let mut components = Vec::new();
        let mut is_absolute = false;

        for component in joined.components() {
            match component {
                std::path::Component::RootDir => {
                    is_absolute = true;
                }
                std::path::Component::Normal(c) => components.push(c),
                std::path::Component::ParentDir => {
                    components.pop();
                }
                _ => {}
            }
        }

        let mut result = PathBuf::new();
        if is_absolute {
            result.push("/");
        }
        for c in components {
            result.push(c);
        }
        result.to_string_lossy().to_string()
    } else {
        relative_path.to_string()
    };

    resolved_path.replace('\\', "/")
}

/// Retrieves the cover image bytes for a book by its database ID.
///
/// Looks up the book's file path in the database, opens the EPUB, and
/// extracts the manifest's cover image.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
///
/// # Returns
///
/// Raw cover image bytes. Returns an empty `Vec<u8>` when the EPUB has no
/// cover image in its manifest.
///
/// # Errors
///
/// Returns a boxed error when the book ID is not found, the file cannot be
/// opened, or the cover image data cannot be read.
pub async fn get_cover_image_by_book_id(
    book_id: i32,
) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    use diesel::prelude::*;
    use diesel_async::RunQueryDsl;

    let mut conn = connect_from_pool().await?;
    let rows = crate::infrastructure::database::models::schema::books::dsl::books
        .filter(crate::infrastructure::database::models::schema::books::book_id.eq(book_id))
        .limit(1)
        .load::<crate::infrastructure::database::models::book::BookRow>(&mut conn)
        .await
        .map_err(|e| format!("Book not found: {}", e))?;
    let book = rows
        .into_iter()
        .next()
        .ok_or_else(|| format!("Book not found: {}", book_id))?;

    let epub = Epub::open(&book.file_path).map_err(|e| e.to_string())?;

    match epub.manifest().cover_image() {
        Some(cover_image) => {
            let bytes = cover_image.read_bytes()?;
            Ok(bytes)
        }
        None => Ok(Vec::new()),
    }
}
