/// A book in the user's library.
#[derive(Debug, Clone)]
pub struct Book {
    /// Auto-generated primary key.
    pub id: i32,
    /// The book's title extracted from ebook metadata.
    pub title: String,
    /// Publication date string from ebook metadata, if available.
    pub published_date: Option<String>,
    /// Foreign key to the [`Publisher`] record, if known.
    pub publisher_id: Option<i32>,
    /// ISBN identifier, if present in the ebook metadata.
    pub isbn: Option<String>,
    /// File format (e.g., `"epub"`, `"pdf"`).
    pub file_type: Option<String>,
    /// Absolute path to the ebook file on disk.
    pub file_path: Option<String>,
    /// Path to a locally cached cover image, if any.
    pub cover_image_path: Option<String>,
    /// SHA-256 checksum of the ebook file, used for duplicate detection.
    pub checksum: Option<String>,
    /// ISO 8601 timestamp of when the book was imported.
    pub added_at: Option<String>,
}
