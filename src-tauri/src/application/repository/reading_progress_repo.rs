use async_trait::async_trait;
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::{AsyncConnection, RunQueryDsl};

use crate::domain::error::DomainError;
use crate::domain::models::reading_progress::ReadingProgress;
use crate::domain::repository::{NewReadingProgress, ReadingProgressRepository};
use crate::infrastructure::database::database::{connect_from_pool, lock_db};
use crate::infrastructure::database::models::reading_progress::{
    NewReadingProgressRow, ReadingProgressRow,
};
use crate::infrastructure::database::models::schema::reading_progress;

/// Diesel-backed implementation of [`ReadingProgressRepository`].
pub struct ReadingProgressRepoImpl;

impl ReadingProgressRepoImpl {
    pub fn new() -> Self {
        Self
    }
}

impl Default for ReadingProgressRepoImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ReadingProgressRepository for ReadingProgressRepoImpl {
    /// Returns the reading progress for a book, or `None` if not tracked.
    async fn find_by_book(
        &self,
        find_book_id: i32,
    ) -> Result<Option<ReadingProgress>, DomainError> {
        let mut conn = connect_from_pool().await?;

        let rows = reading_progress::dsl::reading_progress
            .filter(reading_progress::book_id.eq(find_book_id))
            .limit(1)
            .load::<ReadingProgressRow>(&mut conn)
            .await?;
        match rows.into_iter().next() {
            Some(row) => Ok(Some(ReadingProgress::from(row))),
            None => Ok(None),
        }
    }

    /// Upserts reading progress: inserts a new record or updates an existing
    /// one matched on `book_id`. The `last_read_at` timestamp is set to the
    /// current UTC time.
    async fn upsert(&self, progress: NewReadingProgress) -> Result<(), DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;
        let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        conn.transaction(async |connection| {
            diesel::insert_into(reading_progress::table)
                .values(&NewReadingProgressRow {
                    book_id: progress.book_id,
                    current_position: &progress.current_position,
                    chapter_title: progress.chapter_title.as_deref(),
                    page_number: progress.page_number,
                    progress_percentage: progress.progress_percentage,
                })
                .on_conflict(reading_progress::book_id)
                .do_update()
                .set((
                    reading_progress::current_position.eq(&progress.current_position),
                    reading_progress::chapter_title.eq(&progress.chapter_title),
                    reading_progress::page_number.eq(progress.page_number),
                    reading_progress::progress_percentage.eq(progress.progress_percentage),
                    reading_progress::last_read_at.eq(&now),
                ))
                .execute(connection)
                .await?;
            Ok::<(), diesel::result::Error>(())
        })
        .await?;

        Ok(())
    }
}
