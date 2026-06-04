use crate::application::state::AppState;
use crate::domain::error::DomainError;
use crate::infrastructure::file_handlers::BookMetadata;

pub async fn fetch_metadata(
    book_id: i32,
    state: &AppState,
) -> Result<Option<BookMetadata>, DomainError> {
    crate::application::service::book_service::fetch_metadata(book_id, &state.book_repo).await
}

pub async fn list_metadata(state: &AppState) -> Result<Vec<BookMetadata>, DomainError> {
    crate::application::service::book_service::list_metadata(&state.book_repo).await
}

pub async fn update_metadata(
    book_name: String,
    title: Option<String>,
    published_date: Option<String>,
    isbn: Option<String>,
    state: &AppState,
) -> Result<(), DomainError> {
    crate::application::service::book_service::update_metadata(
        &book_name,
        title.as_deref(),
        published_date.as_deref(),
        isbn.as_deref(),
        &state.book_repo,
    )
    .await
}
