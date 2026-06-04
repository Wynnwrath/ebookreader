pub mod epub_handler;
pub mod mobi_handler;
pub mod pdf_handler;

use serde::Serialize;

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
