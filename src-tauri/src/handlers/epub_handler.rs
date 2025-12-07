use base64::{engine::general_purpose, Engine as _};
use rbook::{prelude::*, Ebook, Epub};
use regex::Regex;
use scraper::{Html, Selector};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use tokio::{fs, task::JoinError};
use walkdir::WalkDir;

/// # This module uses the `rbook` crate to handle EPUB files with the 'threadsafe' feature enabled.
/// Documentation: https://docs.rs/rbook/latest/rbook/
// A struct to hold metadata parsed from an EPUB file.
pub struct BookMetadata {
    pub title: String,
    pub authors: Vec<String>,
    pub published_date: Option<String>,
    pub publishers: Vec<String>,
    pub isbn: Option<String>,
    pub file_path: String,
    pub cover_data: Option<(Vec<u8>, String)>, // (data, mime_type)
    pub checksum: String,
}

// TODO: Test this function
/// Scans for epub files to be added to the library
pub async fn scan_epubs<P: AsRef<Path> + Send + 'static>(
    dir: P,
) -> Result<Vec<PathBuf>, JoinError> {
    tokio::task::spawn_blocking(move || {
        let walker = WalkDir::new(dir).into_iter();
        // collect all .epub files in the directory
        walker
            .filter_map(Result::ok) // Filter out entries that resulted in an error
            .filter(|e| e.file_type().is_file()) // Filter to include only files
            .map(|e| e.into_path()) // Get the path of each entry
            .filter(|p| {
                // Filter to include only .epub files
                p.extension()
                    .and_then(|s| s.to_str())
                    .map(|ext| ext.eq_ignore_ascii_case("epub"))
                    .unwrap_or(false)
            })
            .collect() // Collect the filtered paths into a vector
    })
    .await
}
//TODO: Test this function
/// Parses metadata from an EPUB file and returns a `BookMetadata` struct.
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

        let published_date = metadata.publication_date().map(|d| d.to_string());

        let isbn = metadata
            .identifiers()
            .find(|i| i.value().starts_with("urn:isbn:"))
            .map(|i| i.value().to_string());

        let cover_data = if let Some(cover_image) = book.manifest().images().next() {
            let mime_type = cover_image.resource_kind().as_str().to_string();
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

// TODO: Test this function
/// Stores a cover image to disk and returns the path.
/// The cover is stored in a `covers` subdirectory of the current working directory.
pub async fn store_cover_to_disk(
    cover_data: &[u8],
    media_type: &str,
    base_filename: &str,
) -> Result<String, std::io::Error> {
    let extension = match media_type {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/gif" => "gif",
        _ => "jpg", // default to jpg
    };

    let sanitized_filename = sanitize_filename(base_filename);
    let filename = format!("{}.{}", sanitized_filename, extension);

    let cover_dir = PathBuf::from("covers");
    fs::create_dir_all(&cover_dir).await?;

    let cover_path = cover_dir.join(&filename);
    fs::write(&cover_path, cover_data).await?;

    Ok(cover_path.to_string_lossy().to_string())
}

fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '-' || *c == '_')
        .collect()
}

/// Extracts and returns all HTML content from an EPUB file
pub async fn get_epub_content(
    path: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let path_str = path.to_string();
    tokio::task::spawn_blocking(move || {
        let epub = Epub::open(&path_str).map_err(|e| e.to_string())?;
        let mut combined_html = String::new();

        let img_re = Regex::new(r#"<img[^>]+src="([^"]+)"[^>]*>"#).unwrap();

        let spine = epub.spine().entries().collect::<Vec<_>>();

        for item_ref in spine {
            if let Some(resource) = epub.manifest().by_id(item_ref.idref()) {
                if resource.resource_kind().as_str() == "application/xhtml+xml" {
                    if let Ok(content) = epub.read_resource_str(resource.resource()) {
                        let mut modified_content = content.clone();

                        for cap in img_re.captures_iter(&content) {
                            let src = &cap[1];
                            if !src.starts_with("data:") {
                                // Get the directory of the current resource
                                let current_href = resource.href().as_str();
                                let resolved_href =
                                    if let Some(parent) = Path::new(current_href).parent() {
                                        parent.join(src).to_string_lossy().to_string()
                                    } else {
                                        src.to_string()
                                    };

                                if let Some(image_resource) =
                                    epub.manifest().by_href(&resolved_href)
                                {
                                    if let Ok(image_bytes) = image_resource.read_bytes() {
                                        let encoded =
                                            general_purpose::STANDARD.encode(&image_bytes);
                                        let kind = image_resource.resource_kind();
                                        let mime_type = kind.as_str();
                                        let data_url =
                                            format!("data:{};base64,{}", mime_type, encoded);
                                        modified_content = modified_content.replace(src, &data_url);
                                    }
                                }
                            }
                        }

                        let document = Html::parse_document(&modified_content);
                        let body_selector = Selector::parse("body").unwrap();
                        if let Some(body_node) = document.select(&body_selector).next() {
                            combined_html.push_str(&body_node.inner_html());
                        }
                    }
                }
            }
        }
        Ok(combined_html)
    })
    .await?
    .map_err(|e: String| e.into())
}
/// Stores metadata to disk as a JSON file alongside the EPUB file.
/// Returns the path to the created metadata JSON file.
pub async fn store_metadata_to_disk(
    metadata: &BookMetadata,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let epub_path = Path::new(&metadata.file_path);
    let json_path = epub_path.with_extension("json");

    let metadata_json = serde_json::json!({
        "title": metadata.title,
        "authors": metadata.authors,
        "publishers": metadata.publishers,
        "published_date": metadata.published_date,
        "isbn": metadata.isbn,
        "file_path": metadata.file_path,
        "checksum": metadata.checksum,
        "has_cover": metadata.cover_data.is_some(),
    });

    let json_string = serde_json::to_string_pretty(&metadata_json)?;
    fs::write(&json_path, json_string).await?;

    Ok(json_path.to_string_lossy().to_string())
}

/// Computes the SHA-256 checksum of a file and returns it as a hex string.
pub async fn compute_checksum(path: &str) -> Result<String, std::io::Error> {
    let data = fs::read(path).await?;
    let hash = Sha256::digest(&data);
    Ok(format!("{:x}", hash))
}

/// Extracts fonts from an EPUB file and stores them to disk.
/// Returns a vector of paths to the extracted font files.
pub async fn extract_fonts_to_disk(
    path: &str,
    output_dir: &str,
) -> Result<Vec<String>, Box<dyn std::error::Error + Send + Sync>> {
    let path_str = path.to_string();
    let output_dir_str = output_dir.to_string();

    tokio::task::spawn_blocking(move || {
        let epub = Epub::open(&path_str).map_err(|e| e.to_string())?;
        let mut extracted_fonts: Vec<String> = Vec::new();

        let font_dir = PathBuf::from(&output_dir_str);
        std::fs::create_dir_all(&font_dir).map_err(|e| e.to_string())?;

        // Iterate over manifest entries using IntoIterator
        for resource in &epub.manifest() {
            let resource_kind = resource.resource_kind();
            let mime_type = resource_kind.as_str();
            // Check for common font MIME types
            if mime_type.contains("font")
                || mime_type == "application/vnd.ms-opentype"
                || mime_type == "application/x-font-ttf"
                || mime_type == "application/x-font-otf"
                || mime_type == "application/font-woff"
                || mime_type == "application/font-woff2"
            {
                if let Ok(font_bytes) = resource.read_bytes() {
                    let href = resource.href().as_str();
                    let font_filename = Path::new(href)
                        .file_name()
                        .map(|f| f.to_string_lossy().to_string())
                        .unwrap_or_else(|| format!("font_{}", resource.id()));

                    let font_path = font_dir.join(&font_filename);
                    if std::fs::write(&font_path, font_bytes).is_ok() {
                        extracted_fonts.push(font_path.to_string_lossy().to_string());
                    }
                }
            }
        }

        Ok(extracted_fonts)
    })
    .await?
    .map_err(|e: String| e.into())
}
// TODO: Test this function
/// Exports the combined HTML content of an EPUB file to disk.
pub async fn export_epub_contents_to_disk(
    epub_path: &str,
    output_dir: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let epub_path_str = epub_path.to_string();
    let output_dir_str = output_dir.to_string();

    let contents = get_epub_content(&epub_path_str).await?;

    let output_path = Path::new(&output_dir_str).join("extracted_content.html");

    fs::create_dir_all(&output_dir_str).await?;
    fs::write(output_path, contents).await?;

    Ok(())
}
