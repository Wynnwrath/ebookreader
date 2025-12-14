use serde::{Deserialize, Serialize};

use crate::data::{
    models::books::Books,
    repos::{
        implementors::{
            book_author_repo::BookAuthorRepo,
            publisher_repo::PublisherRepo,
        },
        traits::repository::Repository,
    },
};
#[derive(Serialize, Deserialize)]
pub struct BookResponse {
    pub book_id: i32,
    pub title: String,
    pub author: Option<String>,
    pub published_date: Option<String>,
    pub publisher: Option<String>,
    pub isbn: Option<String>,
    pub file_type: Option<String>,
    pub file_path: Option<String>,
    pub cover_image_path: Option<String>,
    pub checksum: Option<String>,
    pub added_at: Option<String>,
}

impl BookResponse {
    pub async fn from_book(book: Books) -> Result<Self, Box<dyn std::error::Error>> {
        let author_repo = BookAuthorRepo::new().await;

        let publisher_repo = PublisherRepo::new().await;

        let author = match author_repo.get_authors_by_book(book.book_id).await? {
            Some(authors) if !authors.is_empty() => Some(authors[0].name.clone()),
            _ => None,
        };

        let publisher = match book.publisher_id {
            Some(pid) => {
                let publisher = publisher_repo.get_by_id(pid).await?;
                publisher.map(|p| p.name)
            }
            None => None,
        };

        Ok(BookResponse {
            book_id: book.book_id,
            title: book.title,
            author,
            published_date: book.published_date,
            publisher,
            isbn: book.isbn,
            file_type: book.file_type,
            file_path: book.file_path,
            cover_image_path: book.cover_image_path,
            checksum: book.checksum,
            added_at: book.added_at,
        })
    }
}
