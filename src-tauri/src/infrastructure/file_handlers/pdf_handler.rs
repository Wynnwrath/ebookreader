use base64::{Engine as _, engine::general_purpose};
use pdf_oxide::PdfDocument;
use pdf_oxide::extractors::xmp::XmpExtractor;
use pdf_oxide::rendering::{RenderOptions, render_page};
use serde::Serialize;
use std::path::{Path, PathBuf};
use tokio::task::JoinError;
use walkdir::WalkDir;

use crate::infrastructure::file_handlers::BookMetadata;
use crate::utils::file::compute_checksum;

/// A rendered PDF page returned to the frontend.
#[derive(Serialize, Clone)]
pub struct PdfPage {
    /// 0-based page number.
    pub page_number: u32,
    /// Base64-encoded PNG image data of the rendered page.
    pub image_data: String,
    /// Width of the rendered image in pixels.
    pub width: u32,
    /// Height of the rendered image in pixels.
    pub height: u32,
    /// Text spans extracted from the page with bounding box coordinates.
    pub text_spans: Vec<PdfTextSpan>,
}

/// A text span extracted from a PDF page with positional information.
#[derive(Serialize, Clone)]
pub struct PdfTextSpan {
    /// The text content of this span.
    pub text: String,
    /// X coordinate of the bounding box origin.
    pub x: f32,
    /// Y coordinate of the bounding box origin.
    pub y: f32,
    /// Width of the bounding box.
    pub width: f32,
    /// Height of the bounding box.
    pub height: f32,
}

/// Recursively scans a directory for `.pdf` files.
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
/// A vector of absolute paths to matching `.pdf` files.
pub async fn scan_pdfs<P: AsRef<Path> + Send + 'static>(
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
                    .map(|ext| ext.eq_ignore_ascii_case("pdf"))
                    .unwrap_or(false)
            })
            .collect()
    })
    .await
}

/// Parses metadata from a PDF file using XMP metadata extraction.
///
/// Falls back to defaults ("Unknown Author", "Unknown Title", etc.) when XMP
/// data is missing. ISBN is not extracted from PDFs.
///
/// # Arguments
///
/// * `path` - Absolute path to the PDF file.
///
/// # Returns
///
/// A populated [`BookMetadata`] struct with extracted title, authors,
/// publisher, creation date, and the file's SHA-256 checksum.
///
/// # Errors
///
/// Returns a boxed error when the file cannot be opened, is not a valid PDF,
/// or cannot be checksummed.
pub async fn parse_pdf_meta(
    path: String,
) -> Result<BookMetadata, Box<dyn std::error::Error + Send + Sync>> {
    let checksum = compute_checksum(&path).await?;

    tokio::task::spawn_blocking(move || {
        let doc = PdfDocument::open(&path)?;

        let mut title = "Unknown Title".to_string();
        let mut authors = vec!["Unknown Author".to_string()];
        let mut publishers = vec!["Unknown Publisher".to_string()];
        let mut published_date: Option<String> = None;

        if let Ok(Some(xmp)) = XmpExtractor::extract(&doc) {
            if let Some(t) = &xmp.dc_title
                && !t.is_empty()
            {
                title = t.clone();
            }

            if !xmp.dc_creator.is_empty() {
                authors = xmp.dc_creator.clone();
            }

            if let Some(tool) = &xmp.xmp_creator_tool
                && !tool.is_empty()
            {
                publishers = vec![tool.clone()];
            }

            if let Some(date) = &xmp.xmp_create_date {
                published_date = Some(date.clone());
            }
        }

        Ok(BookMetadata {
            title,
            authors,
            published_date,
            publishers,
            isbn: None,
            file_path: path,
            cover_data: None,
            checksum,
        })
    })
    .await?
}

/// Renders the first page of a PDF as a PNG image (150 DPI).
///
/// Used for generating cover thumbnails.
///
/// # Arguments
///
/// * `path` - Absolute path to the PDF file.
///
/// # Returns
///
/// Raw PNG image bytes of the first page.
///
/// # Errors
///
/// Returns a boxed error when the file cannot be opened or the page cannot
/// be rendered.
pub async fn get_pdf_cover(
    path: &str,
) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let path_str = path.to_string();
    tokio::task::spawn_blocking(move || {
        let doc = PdfDocument::open(&path_str)?;
        let opts = RenderOptions::with_dpi(150);
        let image = render_page(&doc, 0, &opts)?;
        Ok(image.data)
    })
    .await?
}

/// Returns the total number of pages in a PDF file.
///
/// # Arguments
///
/// * `path` - Absolute path to the PDF file.
///
/// # Returns
///
/// The page count as a `u32`.
///
/// # Errors
///
/// Returns a boxed error when the file cannot be opened or is not a valid PDF.
pub async fn get_pdf_page_count(
    path: &str,
) -> Result<u32, Box<dyn std::error::Error + Send + Sync>> {
    let path_str = path.to_string();
    tokio::task::spawn_blocking(move || {
        let doc = PdfDocument::open(&path_str)?;
        let count = doc.page_count().unwrap_or(0) as u32;
        Ok(count)
    })
    .await?
}

/// Renders a specific page of a PDF and extracts its text spans.
///
/// The page is rendered at 150 DPI. Returns the page as a base64-encoded
/// image along with positional text data for search and selection.
///
/// # Arguments
///
/// * `path` - Absolute path to the PDF file.
/// * `page_number` - 0-based page index to render.
///
/// # Returns
///
/// A [`PdfPage`] containing the rendered image data, dimensions, and
/// extracted text spans with bounding boxes.
///
/// # Errors
///
/// Returns a boxed error when the file cannot be opened, the page number is
/// out of range, or the page cannot be rendered.
pub async fn read_pdf_page(
    path: &str,
    page_number: u32,
) -> Result<PdfPage, Box<dyn std::error::Error + Send + Sync>> {
    let path_str = path.to_string();
    tokio::task::spawn_blocking(move || {
        let doc = PdfDocument::open(&path_str)?;
        let page_count = doc.page_count().unwrap_or(0);

        if (page_number as usize) >= page_count {
            return Err(format!(
                "Page {} out of range (PDF has {} pages)",
                page_number, page_count
            )
            .into());
        }

        let idx = page_number as usize;
        let render_opts = RenderOptions::with_dpi(150);
        let image = render_page(&doc, idx, &render_opts)?;
        let image_data = general_purpose::STANDARD.encode(&image.data);

        let spans = doc.extract_spans(idx).unwrap_or_default();
        let text_spans: Vec<PdfTextSpan> = spans
            .into_iter()
            .map(|s| PdfTextSpan {
                text: s.text,
                x: s.bbox.x,
                y: s.bbox.y,
                width: s.bbox.width,
                height: s.bbox.height,
            })
            .collect();

        Ok(PdfPage {
            page_number,
            image_data,
            width: image.width,
            height: image.height,
            text_spans,
        })
    })
    .await?
}
