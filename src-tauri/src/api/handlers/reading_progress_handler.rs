use crate::application::state::AppState;
use crate::domain::error::DomainError;
use crate::domain::models::reading_progress::ReadingProgress;
use crate::domain::repository::*;

pub async fn get_progress(
    book_id: i32,
    state: &AppState,
) -> Result<Option<ReadingProgress>, DomainError> {
    crate::application::manage_reading_progress::get_progress(book_id, &state.reading_progress_repo)
        .await
}

pub async fn update_progress(
    book_id: i32,
    current_position: String,
    chapter_title: Option<String>,
    page_number: Option<i32>,
    progress_percentage: Option<f32>,
    state: &AppState,
) -> Result<(), DomainError> {
    crate::application::manage_reading_progress::update_progress(
        NewReadingProgress {
            book_id,
            current_position,
            chapter_title,
            page_number,
            progress_percentage,
        },
        &state.reading_progress_repo,
    )
    .await
}
