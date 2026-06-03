use std::path::Path;

use crate::application::repository::book_repo::BookRepoImpl;
use crate::application::state::AppState;
use crate::domain::dto::book_dto::BookDto;
use crate::domain::error::DomainError;

pub async fn import_book(path: String, state: &AppState) -> Result<BookDto, DomainError> {
    let book_repo_impl = BookRepoImpl::new();

    crate::application::book::import_book(
        Path::new(&path),
        &book_repo_impl,
        &state.author_repo,
        &state.book_author_repo,
        &state.publisher_repo,
    )
    .await
}

pub async fn list_books(state: &AppState) -> Result<Vec<BookDto>, DomainError> {
    crate::application::book::list_books(
        &state.book_repo,
        &state.author_repo,
        &state.publisher_repo,
    )
    .await
}

pub async fn get_book_details(
    book_id: i32,
    state: &AppState,
) -> Result<Option<BookDto>, DomainError> {
    crate::application::book::get_book(
        book_id,
        &state.book_repo,
        &state.author_repo,
        &state.publisher_repo,
    )
    .await
}

pub async fn read_epub(path: String) -> Result<String, DomainError> {
    crate::application::book::read_epub(&path).await
}

pub async fn get_cover_img(book_id: i32, state: &AppState) -> Result<Option<Vec<u8>>, DomainError> {
    crate::application::book::get_cover(book_id, &state.book_repo).await
}

pub async fn remove_book(book_id: i32, state: &AppState) -> Result<(), DomainError> {
    crate::application::book::remove_book(book_id, &state.book_repo).await
}
