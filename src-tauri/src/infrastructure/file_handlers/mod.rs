pub mod epub_handler;
pub mod mobi_handler;
pub mod pdf_handler;

use serde::Serialize;

/// Metadata extracted from an ebook file.
///
/// Used by the import pipeline and the metadata service to populate book
/// records and present metadata to the frontend.
#[derive(Serialize, Clone)]
pub struct BookMetadata {
    /// Book title from the file's metadata.
    pub title: String,
    /// List of author names from the file's metadata.
    pub authors: Vec<String>,
    /// Publication date string, if present.
    pub published_date: Option<String>,
    /// List of publisher names from the file's metadata.
    pub publishers: Vec<String>,
    /// ISBN, if present in the file's metadata.
    pub isbn: Option<String>,
    /// Absolute path to the ebook file on disk.
    pub file_path: String,
    /// Raw cover image bytes and MIME type, if extracted.
    pub cover_data: Option<(Vec<u8>, String)>,
    /// SHA-256 checksum of the file.
    pub checksum: String,
}
