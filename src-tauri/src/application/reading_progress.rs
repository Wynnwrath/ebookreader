use std::sync::Arc;

use crate::domain::error::DomainError;
use crate::domain::models::reading_progress::ReadingProgress;
use crate::domain::repository::*;

pub async fn get_progress(
    book_id: i32,
    reading_progress_repo: &Arc<dyn ReadingProgressRepository>,
) -> Result<Option<ReadingProgress>, DomainError> {
    reading_progress_repo.find_by_book(book_id).await
}

pub async fn update_progress(
    progress: NewReadingProgress,
    reading_progress_repo: &Arc<dyn ReadingProgressRepository>,
) -> Result<(), DomainError> {
    reading_progress_repo.upsert(progress).await
}
