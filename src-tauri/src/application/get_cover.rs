use std::sync::Arc;

use crate::domain::error::DomainError;
use crate::domain::repository::BookRepository;
use crate::infrastructure::file_handlers::epub_handler;

pub async fn get_cover(
    book_id: i32,
    book_repo: &Arc<dyn BookRepository>,
) -> Result<Option<Vec<u8>>, DomainError> {
    let _book = book_repo
        .find_by_id(book_id)
        .await?
        .ok_or(DomainError::BookNotFound(book_id))?;

    match epub_handler::get_cover_image_by_book_id(book_id).await {
        Ok(img) => Ok(Some(img)),
        Err(_) => Ok(None),
    }
}
