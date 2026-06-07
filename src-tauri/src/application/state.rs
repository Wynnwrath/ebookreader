use crate::domain::repository::*;
use std::sync::Arc;

/// Application-wide dependency container.
///
/// Holds `Arc`-wrapped trait objects for every repository, enabling
/// dependency injection and testability. Passed to Tauri commands as
/// `State<'_, AppState>`.
pub struct AppState {
    pub book_repo: Arc<dyn BookRepository>,
    pub author_repo: Arc<dyn AuthorRepository>,
    pub publisher_repo: Arc<dyn PublisherRepository>,
    pub book_author_repo: Arc<dyn BookAuthorRepository>,
    pub bookmark_repo: Arc<dyn BookmarkRepository>,
    pub annotation_repo: Arc<dyn AnnotationRepository>,
    pub reading_progress_repo: Arc<dyn ReadingProgressRepository>,
}
