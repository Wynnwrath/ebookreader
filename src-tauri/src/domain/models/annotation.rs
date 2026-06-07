/// A highlighted text annotation with an optional note.
#[derive(Debug, Clone, serde::Serialize)]
pub struct Annotation {
    /// Auto-generated primary key.
    pub id: i32,
    /// The book this annotation belongs to.
    pub book_id: i32,
    /// Title of the chapter containing the annotation, if known.
    pub chapter_title: Option<String>,
    /// Start position of the highlighted text (format depends on file type).
    pub start_position: String,
    /// End position of the highlighted text.
    pub end_position: String,
    /// The actual highlighted text content, if captured.
    pub highlighted_text: Option<String>,
    /// User-written note attached to the highlight.
    pub note: Option<String>,
    /// Color identifier for the highlight (e.g., `"yellow"`, `"#FF0000"`).
    pub color: Option<String>,
    /// ISO 8601 timestamp of when the annotation was created.
    pub created_at: Option<String>,
    /// ISO 8601 timestamp of the last modification.
    pub updated_at: Option<String>,
}
