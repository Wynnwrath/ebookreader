use std::sync::Arc;

use crate::domain::dto::book_dto::BookDto;
use crate::domain::error::DomainError;
use crate::domain::repository::*;

pub async fn get_book(
    find_id: i32,
    book_repo: &Arc<dyn BookRepository>,
    author_repo: &Arc<dyn AuthorRepository>,
    publisher_repo: &Arc<dyn PublisherRepository>,
) -> Result<Option<BookDto>, DomainError> {
    let book = match book_repo.find_by_id(find_id).await? {
        Some(b) => b,
        None => return Ok(None),
    };

    let authors = author_repo.get_authors_by_book(book.id).await?;
    let author = authors.first().map(|a| a.name.clone());

    let publisher = match book.publisher_id {
        Some(pid) => publisher_repo.find_by_id(pid).await?.map(|p| p.name),
        None => None,
    };

    Ok(Some(BookDto::new(&book, author, publisher)))
}
