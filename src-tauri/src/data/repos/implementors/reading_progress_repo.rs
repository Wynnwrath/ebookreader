use async_trait::async_trait;
use diesel::prelude::*;
use diesel::result::{DatabaseErrorKind, Error};
use diesel_async::scoped_futures::ScopedFutureExt;
use diesel_async::{AsyncConnection, RunQueryDsl};
use tokio::sync::MutexGuard;

use crate::data::{
    database::{connect_from_pool, lock_db},
    models::reading_progress::{NewReadingProgress, ReadingProgress, UpdateReadingProgress},
    repos::traits::repository::Repository,
};

pub struct ReadingProgressRepo;

impl ReadingProgressRepo {
    pub async fn new() -> Self {
        ReadingProgressRepo
    }

    pub async fn get_by_user_and_book(
        &self,
        uid: i32,
        bid: i32,
    ) -> Result<Option<ReadingProgress>, Error> {
        use crate::data::models::schema::reading_progress::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match reading_progress
            .filter(user_id.eq(uid))
            .filter(book_id.eq(bid))
            .first::<ReadingProgress>(&mut conn)
            .await
        {
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }
    /// Upsert reading progress for a user and book
    pub async fn upsert<'a>(&self, progress: NewReadingProgress<'a>) -> Result<(), Error> {
        use crate::data::models::schema::reading_progress::dsl::*;
        use chrono::Utc;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        conn.transaction(|connection| {
            async move {
                diesel::insert_into(reading_progress)
                    .values(&progress)
                    .on_conflict((user_id, book_id))
                    .do_update()
                    .set((
                        current_position.eq(progress.current_position),
                        chapter_title.eq(progress.chapter_title),
                        page_number.eq(progress.page_number),
                        progress_percentage.eq(progress.progress_percentage),
                        last_read_at.eq(&now),
                    ))
                    .execute(connection)
                    .await?;
                Ok(())
            }
            .scope_boxed()
        })
        .await
    }

    pub async fn get_by_user(&self, uid: i32) -> Result<Option<Vec<ReadingProgress>>, Error> {
        use crate::data::models::schema::reading_progress::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match reading_progress
            .filter(user_id.eq(uid))
            .load::<ReadingProgress>(&mut conn)
            .await
        {
            Ok(value) if value.is_empty() => Ok(None),
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }
}

#[async_trait]
impl Repository for ReadingProgressRepo {
    type Item = ReadingProgress;
    type NewItem<'a> = NewReadingProgress<'a>;
    type Form<'a> = UpdateReadingProgress<'a>;
    type Id = i32;

    async fn get_all(&self) -> Result<Option<Vec<Self::Item>>, Error> {
        use crate::data::models::schema::reading_progress::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match reading_progress.load::<Self::Item>(&mut conn).await {
            Ok(value) if value.is_empty() => Ok(None),
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }

    async fn get_by_id(&self, id: Self::Id) -> Result<Option<Self::Item>, Error> {
        use crate::data::models::schema::reading_progress::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match reading_progress
            .filter(progress_id.eq(id))
            .first::<ReadingProgress>(&mut conn)
            .await
        {
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }

    async fn add<'a>(&self, new_item: Self::NewItem<'a>) -> Result<(), Error> {
        use crate::data::models::schema::reading_progress::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        conn.transaction(|connection| {
            async move {
                diesel::insert_into(reading_progress)
                    .values(new_item)
                    .execute(connection)
                    .await?;
                Ok(())
            }
            .scope_boxed()
        })
        .await
    }

    async fn update<'a>(&self, id: Self::Id, updated_item: Self::Form<'a>) -> Result<(), Error> {
        use crate::data::models::schema::reading_progress::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        conn.transaction(|connection| {
            async move {
                diesel::update(reading_progress.filter(progress_id.eq(id)))
                    .set(updated_item)
                    .execute(connection)
                    .await?;
                Ok(())
            }
            .scope_boxed()
        })
        .await
    }

    async fn delete(&self, id: Self::Id) -> Result<(), Error> {
        use crate::data::models::schema::reading_progress::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        conn.transaction(|connection| {
            async move {
                diesel::delete(reading_progress.filter(progress_id.eq(id)))
                    .execute(connection)
                    .await?;
                Ok(())
            }
            .scope_boxed()
        })
        .await
    }
}
