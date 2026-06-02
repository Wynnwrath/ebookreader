use std::sync::Arc;

use crate::domain::error::DomainError;
use crate::domain::repository::BookRepository;

pub async fn remove_book(
    find_id: i32,
    book_repo: &Arc<dyn BookRepository>,
) -> Result<(), DomainError> {
    book_repo.delete(find_id).await
}
