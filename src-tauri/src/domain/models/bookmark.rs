/// A user-created bookmark within a book.
#[derive(Debug, Clone, serde::Serialize)]
pub struct Bookmark {
    /// Auto-generated primary key.
    pub id: i32,
    /// The book this bookmark belongs to.
    pub book_id: i32,
    /// Title of the chapter where the bookmark was placed, if known.
    pub chapter_title: Option<String>,
    /// Page number for PDF books, if applicable.
    pub page_number: Option<i32>,
    /// Position identifier (e.g., EPUB CFI, byte offset) marking the bookmark location.
    pub position: String,
    /// ISO 8601 timestamp of when the bookmark was created.
    pub created_at: Option<String>,
}
