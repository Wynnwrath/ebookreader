use std::path::Path;

use crate::application::state::AppState;
use crate::domain::error::DomainError;

pub async fn scan_directory(
    directory_path: String,
    state: &AppState,
) -> Result<Vec<String>, DomainError> {
    crate::application::book::scan_directory(
        Path::new(&directory_path),
        &state.book_repo,
        &state.author_repo,
        &state.book_author_repo,
        &state.publisher_repo,
    )
    .await
}
