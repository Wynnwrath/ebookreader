use async_trait::async_trait;
use diesel::prelude::*;
use diesel_async::{AsyncConnection, RunQueryDsl};

use crate::domain::error::DomainError;
use crate::domain::models::author::Author;
use crate::domain::repository::AuthorRepository;
use crate::infrastructure::database::database::{connect_from_pool, lock_db};
use crate::infrastructure::database::models::author::{AuthorRow, NewAuthorRow};
use crate::infrastructure::database::models::schema::{authors, book_authors};

/// Diesel-backed implementation of [`AuthorRepository`].
pub struct AuthorRepoImpl;

impl AuthorRepoImpl {
    pub fn new() -> Self {
        Self
    }
}

impl Default for AuthorRepoImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AuthorRepository for AuthorRepoImpl {
    /// Finds an existing author by name, or inserts a new one and returns it.
    async fn find_or_create(&self, author_name: &str) -> Result<Author, DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        // Check if author exists
        let existing_rows = authors::dsl::authors
            .filter(authors::name.eq(author_name))
            .limit(1)
            .load::<AuthorRow>(&mut conn)
            .await?;

        match existing_rows.into_iter().next() {
            Some(row) => Ok(Author::from(row)),
            None => {
                // Insert new author
                let new_row = NewAuthorRow { name: author_name };
                
                conn.transaction(async |connection| {
                    diesel::insert_into(authors::table)
                        .values(&new_row)
                        .execute(connection)
                        .await?;
                    Ok::<(), diesel::result::Error>(())
                })
                .await?;

                // Return the newly created author
                let rows = authors::dsl::authors
                    .filter(authors::name.eq(author_name))
                    .limit(1)
                    .load::<AuthorRow>(&mut conn)
                    .await?;
                let row = rows.into_iter().next().unwrap();
                Ok(Author::from(row))
            }
        }
    }

    /// Returns all authors linked to the given book via `book_authors`.
    async fn get_authors_by_book(&self, find_book_id: i32) -> Result<Vec<Author>, DomainError> {
        let mut conn = connect_from_pool().await?;

        let rows = book_authors::table
            .inner_join(authors::table)
            .filter(book_authors::book_id.eq(find_book_id))
            .select((authors::author_id, authors::name))
            .load::<AuthorRow>(&mut conn)
            .await?;

        Ok(rows.into_iter().map(Author::from).collect())
    }
}
