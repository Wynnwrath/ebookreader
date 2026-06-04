use std::sync::Arc;

use crate::domain::error::DomainError;
use crate::domain::models::reading_progress::ReadingProgress;
use crate::domain::repository::*;

/// Returns the current reading progress for a book.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
/// * `reading_progress_repo` - Repository for querying progress.
///
/// # Returns
///
/// `Some(ReadingProgress)` when the book has a tracked progress record,
/// or `None` if the book has never been opened.
///
/// # Errors
///
/// Delegates to the repository; returns [`DomainError::Database`] on failure.
pub async fn get_progress(
    book_id: i32,
    reading_progress_repo: &Arc<dyn ReadingProgressRepository>,
) -> Result<Option<ReadingProgress>, DomainError> {
    reading_progress_repo.find_by_book(book_id).await
}

/// Creates or updates reading progress for a book (upsert).
///
/// If a progress record already exists for the book, its fields are updated
/// and `last_read_at` is set to the current UTC time.
///
/// # Arguments
///
/// * `progress` - Reading progress data (book ID, position, optional chapter/page/percentage).
/// * `reading_progress_repo` - Repository for upserting the progress record.
///
/// # Errors
///
/// Delegates to the repository; returns [`DomainError::Database`] on failure.
pub async fn update_progress(
    progress: NewReadingProgress,
    reading_progress_repo: &Arc<dyn ReadingProgressRepository>,
) -> Result<(), DomainError> {
    reading_progress_repo.upsert(progress).await
}
