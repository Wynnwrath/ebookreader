use async_trait::async_trait;
use diesel::prelude::*;
use diesel::result::{DatabaseErrorKind, Error};
use diesel_async::scoped_futures::ScopedFutureExt;
use diesel_async::{AsyncConnection, RunQueryDsl};

use crate::data::{
    database::connect_from_pool,
    models::bookmarks::{Bookmarks, NewBookmark, UpdateBookmark},
    repos::traits::repository::Repository,
};

pub struct BookmarkRepo;

impl BookmarkRepo {
    pub async fn new() -> Self {
        BookmarkRepo
    }

    pub async fn get_by_user_and_book(
        &self,
        uid: i32,
        bid: i32,
    ) -> Result<Option<Vec<Bookmarks>>, Error> {
        use crate::data::models::schema::bookmarks;
        use crate::data::models::schema::bookmarks::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match bookmarks
            .filter(bookmarks::user_id.eq(uid))
            .filter(bookmarks::book_id.eq(bid))
            .load::<Bookmarks>(&mut conn)
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
impl Repository for BookmarkRepo {
    type Item = Bookmarks;
    type NewItem<'a> = NewBookmark<'a>;
    type Form<'a> = UpdateBookmark<'a>;
    type Id = i32;

    async fn get_all(&self) -> Result<Option<Vec<Self::Item>>, Error> {
        use crate::data::models::schema::bookmarks::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match bookmarks.load::<Self::Item>(&mut conn).await {
            Ok(value) if value.is_empty() => Ok(None),
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }

    async fn get_by_id(&self, id: Self::Id) -> Result<Option<Self::Item>, Error> {
        use crate::data::models::schema::bookmarks::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match bookmarks
            .filter(bookmark_id.eq(id))
            .first::<Bookmarks>(&mut conn)
            .await
        {
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }

    async fn add<'a>(&self, new_item: Self::NewItem<'a>) -> Result<(), Error> {
        use crate::data::models::schema::bookmarks::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        conn.transaction(|connection| {
            async move {
                diesel::insert_into(bookmarks)
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
        use crate::data::models::schema::bookmarks::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        conn.transaction(|connection| {
            async move {
                diesel::update(bookmarks.filter(bookmark_id.eq(id)))
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
        use crate::data::models::schema::bookmarks::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        conn.transaction(|connection| {
            async move {
                diesel::delete(bookmarks.filter(bookmark_id.eq(id)))
                    .execute(connection)
                    .await?;
                Ok(())
            }
            .scope_boxed()
        })
        .await
    }
}
