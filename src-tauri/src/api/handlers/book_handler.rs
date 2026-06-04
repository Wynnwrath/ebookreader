use std::path::Path;

use crate::application::state::AppState;
use crate::domain::dto::book_dto::BookDto;
use crate::domain::error::DomainError;

/// Imports an ebook file at the given path into the library.
pub async fn import_book(path: String, state: &AppState) -> Result<BookDto, DomainError> {
    crate::application::book::import_book(
        Path::new(&path),
        &state.book_repo,
        &state.author_repo,
        &state.book_author_repo,
        &state.publisher_repo,
    )
    .await
}

/// Returns all books in the library as DTOs.
pub async fn list_books(state: &AppState) -> Result<Vec<BookDto>, DomainError> {
    crate::application::book::list_books(
        &state.book_repo,
        &state.author_repo,
        &state.publisher_repo,
    )
    .await
}

/// Returns book details by ID as a DTO.
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

/// Reads the full HTML content of an EPUB file.
pub async fn read_epub(path: String) -> Result<String, DomainError> {
    crate::application::book::read_epub(&path).await
}

/// Reads content from an ebook file by type (EPUB or PDF).
pub async fn read_book(
    path: String,
    file_type: String,
) -> Result<crate::application::book::BookContent, DomainError> {
    crate::application::book::read_book(&path, &file_type).await
}

/// Returns the page count of a PDF file.
pub async fn get_pdf_page_count(path: String) -> Result<u32, DomainError> {
    crate::infrastructure::file_handlers::pdf_handler::get_pdf_page_count(&path)
        .await
        .map_err(|e| DomainError::Parse(e.to_string()))
}

/// Renders a specific page of a PDF.
pub async fn read_pdf_page(
    path: String,
    page_number: u32,
) -> Result<crate::infrastructure::file_handlers::pdf_handler::PdfPage, DomainError> {
    crate::infrastructure::file_handlers::pdf_handler::read_pdf_page(&path, page_number)
        .await
        .map_err(|e| DomainError::Parse(e.to_string()))
}

/// Returns the cover image bytes for a book.
pub async fn get_cover_img(book_id: i32, state: &AppState) -> Result<Option<Vec<u8>>, DomainError> {
    crate::application::book::get_cover(book_id, &state.book_repo).await
}

/// Removes a book from the library by ID.
pub async fn remove_book(book_id: i32, state: &AppState) -> Result<(), DomainError> {
    crate::application::book::remove_book(book_id, &state.book_repo).await
}
