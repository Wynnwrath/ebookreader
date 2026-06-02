use std::sync::Arc;

use crate::domain::dto::book_dto::BookDto;
use crate::domain::error::DomainError;
use crate::domain::repository::*;

pub async fn list_books(
    book_repo: &Arc<dyn BookRepository>,
    author_repo: &Arc<dyn AuthorRepository>,
    publisher_repo: &Arc<dyn PublisherRepository>,
) -> Result<Vec<BookDto>, DomainError> {
    let books = book_repo.find_all().await?;
    let mut dtos = Vec::new();

    for book in books {
        let authors = author_repo.get_authors_by_book(book.id).await?;
        let author = authors.first().map(|a| a.name.clone());

        let publisher = match book.publisher_id {
            Some(pid) => publisher_repo.find_by_id(pid).await?.map(|p| p.name),
            None => None,
        };

        dtos.push(BookDto::new(&book, author, publisher));
    }

    Ok(dtos)
}
