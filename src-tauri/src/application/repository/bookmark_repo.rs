use async_trait::async_trait;
use diesel::prelude::*;
use diesel_async::{AsyncConnection, RunQueryDsl};

use crate::domain::error::DomainError;
use crate::domain::models::bookmark::Bookmark;
use crate::domain::repository::{BookmarkRepository, NewBookmark};
use crate::infrastructure::database::database::{connect_from_pool, lock_db};
use crate::infrastructure::database::models::bookmark::{BookmarkRow, NewBookmarkRow};
use crate::infrastructure::database::models::schema::bookmarks;

pub struct BookmarkRepoImpl;

impl BookmarkRepoImpl {
    pub fn new() -> Self {
        Self
    }
}

impl Default for BookmarkRepoImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl BookmarkRepository for BookmarkRepoImpl {
    async fn find_by_book(&self, find_book_id: i32) -> Result<Vec<Bookmark>, DomainError> {
        let mut conn = connect_from_pool().await?;

        let rows = bookmarks::dsl::bookmarks
            .filter(bookmarks::book_id.eq(find_book_id))
            .load::<BookmarkRow>(&mut conn)
            .await?;

        Ok(rows.into_iter().map(Bookmark::from).collect())
    }

    async fn insert(&self, bookmark: NewBookmark) -> Result<(), DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        let new_row = NewBookmarkRow {
            book_id: bookmark.book_id,
            chapter_title: bookmark.chapter_title.as_deref(),
            page_number: bookmark.page_number,
            position: &bookmark.position,
        };

        conn.transaction(async |connection| {
            diesel::insert_into(bookmarks::table)
                .values(&new_row)
                .execute(connection)
                .await?;
            Ok::<(), diesel::result::Error>(())
        })
        .await?;

        Ok(())
    }

    async fn delete(&self, find_id: i32) -> Result<(), DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        conn.transaction(async |connection| {
            diesel::delete(
                bookmarks::dsl::bookmarks.filter(bookmarks::bookmark_id.eq(find_id)),
            )
            .execute(connection)
            .await?;
            Ok::<(), diesel::result::Error>(())
        })
        .await?;

        Ok(())
    }
}
