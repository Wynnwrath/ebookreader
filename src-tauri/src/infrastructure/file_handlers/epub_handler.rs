use base64::{Engine as _, engine::general_purpose};
use rbook::{Ebook, Epub, prelude::*};
use regex::Regex;
use scraper::{Html, Selector};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use tokio::{fs, task::JoinError};
use walkdir::WalkDir;

use crate::infrastructure::database::database::connect_from_pool;

pub struct EpubHandler;

#[derive(Serialize, Clone)]
pub struct BookMetadata {
    pub title: String,
    pub authors: Vec<String>,
    pub published_date: Option<String>,
    pub publishers: Vec<String>,
    pub isbn: Option<String>,
    pub file_path: String,
    pub cover_data: Option<(Vec<u8>, String)>,
    pub checksum: String,
}

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

        let cover_data = if let Some(cover_image) = book.manifest().cover_image() {
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

pub async fn get_epub_content(
    path: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let path_str = path.to_string();
    tokio::task::spawn_blocking(move || {
        let epub = Epub::open(&path_str).map_err(|e| e.to_string())?;
        let mut combined_html = String::new();

        let img_re = Regex::new(r#"(?i)(<img[^>]*?src=["'])([^"']+)(["'][^>]*?>)"#).unwrap();
        let image_re =
            Regex::new(r#"(?i)(<image[^>]*?(?:xlink:)?href=["'])([^"']+)(["'][^>]*?>)"#).unwrap();

        let spine = epub.spine().entries().collect::<Vec<_>>();

        for item_ref in spine {
            if let Some(resource) = epub.manifest().by_id(item_ref.idref())
                && resource.resource_kind().as_str() == "application/xhtml+xml"
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
                            let kind = image_resource.resource_kind();
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
                            let kind = image_resource.resource_kind();
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

pub async fn compute_checksum(path: &str) -> Result<String, std::io::Error> {
    let data = fs::read(path).await?;
    let hash = Sha256::digest(&data);
    Ok(format!("{:x}", hash))
}

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
