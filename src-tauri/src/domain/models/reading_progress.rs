/// Reading progress tracking for a book.
#[derive(Debug, Clone, serde::Serialize)]
pub struct ReadingProgress {
    /// Auto-generated primary key.
    pub id: i32,
    /// The book this progress record belongs to.
    pub book_id: i32,
    /// Current position identifier (format depends on file type).
    pub current_position: String,
    /// Title of the current chapter, if known.
    pub chapter_title: Option<String>,
    /// Current page number for PDF books, if applicable.
    pub page_number: Option<i32>,
    /// Reading completion percentage (0.0–100.0).
    pub progress_percentage: Option<f32>,
    /// ISO 8601 timestamp of when the book was last read.
    pub last_read_at: Option<String>,
}
