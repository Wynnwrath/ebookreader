use async_trait::async_trait;
use diesel::prelude::*;
use diesel::sql_query;
use diesel::sql_types::Integer;
use diesel_async::{AsyncConnection, RunQueryDsl, scoped_futures::ScopedFutureExt};

use crate::domain::error::DomainError;
use crate::domain::models::book::Book;
use crate::domain::repository::{BookRepository, NewBook, UpdateBook};
use crate::infrastructure::database::database::{connect_from_pool, lock_db};
use crate::infrastructure::database::models::book::{BookRow, NewBookRow, UpdateBookRow};
use crate::infrastructure::database::models::book_author::BookAuthorRow;
use crate::infrastructure::database::models::schema::{book_authors, books};

#[derive(QueryableByName)]
struct LastInsertRow {
    #[diesel(sql_type = Integer)]
    book_id: i32,
}

pub struct BookRepoImpl;

impl Default for BookRepoImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl BookRepoImpl {
    pub fn new() -> Self {
        Self
    }

    pub async fn import_with_links(
        &self,
        book: NewBook,
        author_ids: &[(i32, String)],
        publisher_id: Option<i32>,
    ) -> Result<Book, DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        let new_row = NewBookRow {
            title: &book.title,
            published_date: book.published_date.as_deref(),
            publisher_id,
            isbn: book.isbn.as_deref(),
            file_type: &book.file_type,
            file_path: &book.file_path,
            cover_image_path: book.cover_image_path.as_deref(),
            checksum: book.checksum.as_deref(),
        };

        let book_id = conn
            .transaction(|connection| {
                async move {
                    diesel::insert_into(books::table)
                        .values(&new_row)
                        .execute(connection)
                        .await?;

                    // Get the last inserted row ID reliably
                    let result = sql_query("SELECT last_insert_rowid() as book_id")
                        .get_result::<LastInsertRow>(connection)
                        .await?;
                    let book_id = result.book_id;

                    // Link all authors in the same transaction
                    for (author_id, _author_name) in author_ids {
                        let link = BookAuthorRow {
                            book_id,
                            author_id: *author_id,
                        };
                        diesel::insert_into(book_authors::table)
                            .values(&link)
                            .execute(connection)
                            .await?;
                    }

                    Ok::<i32, diesel::result::Error>(book_id)
                }
                .scope_boxed()
            })
            .await?;

        // Update publisher_id if set (outside transaction since it's a separate column update)
        if let Some(pid) = publisher_id {
            diesel::update(books::dsl::books.filter(books::book_id.eq(book_id)))
                .set(books::publisher_id.eq(pid))
                .execute(&mut conn)
                .await?;
        }

        // Return the full book
        let row = books::dsl::books
            .filter(books::book_id.eq(book_id))
            .limit(1)
            .load::<BookRow>(&mut conn)
            .await?
            .into_iter()
            .next()
            .ok_or_else(|| DomainError::Database("Failed to retrieve imported book".into()))?;

        Ok(Book::from(row))
    }
}

#[async_trait]
impl BookRepository for BookRepoImpl {
    async fn find_all(&self) -> Result<Vec<Book>, DomainError> {
        let mut conn = connect_from_pool().await?;

        let rows = books::dsl::books.load::<BookRow>(&mut conn).await?;

        Ok(rows.into_iter().map(Book::from).collect())
    }

    async fn find_by_id(&self, find_id: i32) -> Result<Option<Book>, DomainError> {
        let mut conn = connect_from_pool().await?;

        let rows = books::dsl::books
            .filter(books::book_id.eq(find_id))
            .limit(1)
            .load::<BookRow>(&mut conn)
            .await?;
        match rows.into_iter().next() {
            Some(row) => Ok(Some(Book::from(row))),
            None => Ok(None),
        }
    }

    async fn insert(&self, book: NewBook) -> Result<i32, DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        let new_row = NewBookRow {
            title: &book.title,
            published_date: book.published_date.as_deref(),
            publisher_id: book.publisher_id,
            isbn: book.isbn.as_deref(),
            file_type: &book.file_type,
            file_path: &book.file_path,
            cover_image_path: book.cover_image_path.as_deref(),
            checksum: book.checksum.as_deref(),
        };

        let id = conn
            .transaction(|connection| {
                async move {
                    diesel::insert_into(books::table)
                        .values(&new_row)
                        .execute(connection)
                        .await?;

                    let result = sql_query("SELECT last_insert_rowid() as book_id")
                        .get_result::<LastInsertRow>(connection)
                        .await?;
                    Ok::<i32, diesel::result::Error>(result.book_id)
                }
                .scope_boxed()
            })
            .await?;

        Ok(id)
    }

    async fn update(&self, find_id: i32, book: UpdateBook) -> Result<(), DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        let update_row = UpdateBookRow {
            title: book.title.as_deref(),
            published_date: book.published_date.as_deref(),
            publisher_id: book.publisher_id,
            isbn: book.isbn.as_deref(),
            file_type: book.file_type.as_deref(),
            file_path: book.file_path.as_deref(),
            cover_image_path: book.cover_image_path.as_deref(),
            checksum: book.checksum.as_deref(),
        };

        conn.transaction(|connection| {
            async move {
                diesel::update(books::dsl::books.filter(books::book_id.eq(find_id)))
                    .set(&update_row)
                    .execute(connection)
                    .await?;
                Ok::<(), diesel::result::Error>(())
            }
            .scope_boxed()
        })
        .await?;

        Ok(())
    }

    async fn delete(&self, find_id: i32) -> Result<(), DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        conn.transaction(|connection| {
            async move {
                diesel::delete(books::dsl::books.filter(books::book_id.eq(find_id)))
                    .execute(connection)
                    .await?;
                Ok::<(), diesel::result::Error>(())
            }
            .scope_boxed()
        })
        .await?;

        Ok(())
    }

    async fn find_by_checksum(&self, checksum_str: &str) -> Result<Option<Book>, DomainError> {
        let mut conn = connect_from_pool().await?;

        let rows = books::dsl::books
            .filter(books::checksum.eq(checksum_str))
            .limit(1)
            .load::<BookRow>(&mut conn)
            .await?;
        match rows.into_iter().next() {
            Some(row) => Ok(Some(Book::from(row))),
            None => Ok(None),
        }
    }

    async fn search_by_title(&self, title_query: &str) -> Result<Vec<Book>, DomainError> {
        let mut conn = connect_from_pool().await?;

        let rows = books::dsl::books
            .filter(books::title.like(format!("%{}%", title_query)))
            .load::<BookRow>(&mut conn)
            .await?;

        Ok(rows.into_iter().map(Book::from).collect())
    }
}
