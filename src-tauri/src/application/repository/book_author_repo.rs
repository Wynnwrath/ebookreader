use async_trait::async_trait;

use crate::domain::error::DomainError;
use crate::domain::repository::BookAuthorRepository;
use crate::infrastructure::database::database::{connect_from_pool, lock_db};
use crate::infrastructure::database::models::book_author::BookAuthorRow;
use crate::infrastructure::database::models::schema::book_authors;
use diesel_async::{AsyncConnection, RunQueryDsl};

/// Diesel-backed implementation of [`BookAuthorRepository`].
pub struct BookAuthorRepoImpl;

impl BookAuthorRepoImpl {
    pub fn new() -> Self {
        Self
    }
}

impl Default for BookAuthorRepoImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl BookAuthorRepository for BookAuthorRepoImpl {
    /// Creates a book-author link in the `book_authors` join table.
    async fn link(&self, find_book_id: i32, find_author_id: i32) -> Result<(), DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        let row = BookAuthorRow {
            book_id: find_book_id,
            author_id: find_author_id,
        };

        conn.transaction(async |connection| {
            diesel::insert_into(book_authors::table)
                .values(&row)
                .execute(connection)
                .await?;
            Ok::<(), diesel::result::Error>(())
        })
        .await?;

        Ok(())
    }
}
