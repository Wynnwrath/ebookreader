use serde::Serialize;

/// Data transfer object for books sent to the frontend.
///
/// Combines a [`Book`](crate::domain::models::book::Book) with its first author
/// and publisher names for convenient rendering in the UI.
#[derive(Debug, Clone, Serialize)]
pub struct BookDto {
    pub id: i32,
    pub title: String,
    pub author: Option<String>,
    pub published_date: Option<String>,
    pub publisher: Option<String>,
    pub isbn: Option<String>,
    pub file_type: Option<String>,
    pub file_path: Option<String>,
    pub cover_image_path: Option<String>,
    pub checksum: Option<String>,
    pub added_at: Option<String>,
}

impl BookDto {
    /// Constructs a `BookDto` from a domain [`Book`](crate::domain::models::book::Book) and
    /// resolved author/publisher names.
    pub fn new(
        book: &crate::domain::models::book::Book,
        author: Option<String>,
        publisher: Option<String>,
    ) -> Self {
        Self {
            id: book.id,
            title: book.title.clone(),
            author,
            published_date: book.published_date.clone(),
            publisher,
            isbn: book.isbn.clone(),
            file_type: book.file_type.clone(),
            file_path: book.file_path.clone(),
            cover_image_path: book.cover_image_path.clone(),
            checksum: book.checksum.clone(),
            added_at: book.added_at.clone(),
        }
    }
}
