use async_trait::async_trait;
use diesel::prelude::*;
use diesel::result::{DatabaseErrorKind, Error};
use diesel_async::scoped_futures::ScopedFutureExt;
use diesel_async::{AsyncConnection, RunQueryDsl};
use tokio::sync::MutexGuard;

use crate::data::{
    database::{connect_from_pool, lock_db},
    models::{authors::Authors, book_authors::BookAuthors, books::Books},
    repos::traits::repository::Repository,
};

pub struct BookAuthorRepo;

impl BookAuthorRepo {
    pub async fn new() -> Self {
        BookAuthorRepo
    }

    pub async fn get_authors_by_book(&self, bid: i32) -> Result<Option<Vec<Authors>>, Error> {
        use crate::data::models::schema::{authors, book_authors};

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        return match book_authors::table
            .inner_join(authors::table.on(authors::author_id.eq(book_authors::author_id)))
            .filter(book_authors::book_id.eq(bid))
            .select((authors::author_id, authors::name))
            .load::<Authors>(&mut conn)
            .await
        {
            Ok(value) if value.is_empty() => Ok(None),
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        };
    }

    pub async fn get_books_by_author(&self, aid: i32) -> Result<Option<Vec<Books>>, Error> {
        use crate::data::models::schema::{book_authors, books};

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        return match book_authors::table
            .inner_join(books::table.on(books::book_id.eq(book_authors::book_id)))
            .filter(book_authors::author_id.eq(aid))
            .select((
                books::book_id,
                books::title,
                books::published_date,
                books::publisher_id,
                books::isbn,
                books::file_type,
                books::file_path,
                books::cover_image_path,
                books::checksum,
                books::added_at,
            ))
            .load::<Books>(&mut conn)
            .await
        {
            Ok(value) if value.is_empty() => Ok(None),
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        };
    }
}

#[async_trait]
impl Repository for BookAuthorRepo {
    type Item = BookAuthors;
    type NewItem<'a> = BookAuthors; // Insertable is same as the main struct
    type Form<'a> = BookAuthors; // No update form needed for junction tables
    type Id = (i32, i32); // Tuple: (book_id, author_id)

    async fn get_all(&self) -> Result<Option<Vec<Self::Item>>, Error> {
        use crate::data::models::schema::book_authors::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match book_authors.load::<Self::Item>(&mut conn).await {
            Ok(value) if value.is_empty() => Ok(None),
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }

    async fn get_by_id(&self, id: Self::Id) -> Result<Option<Self::Item>, Error> {
        use crate::data::models::schema::book_authors::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match book_authors
            .filter(book_id.eq(id.0).and(author_id.eq(id.1)))
            .first::<BookAuthors>(&mut conn)
            .await
        {
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }

    async fn add<'a>(&self, new_item: Self::NewItem<'a>) -> Result<(), Error> {
        use crate::data::models::schema::book_authors::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        let db_lock = lock_db();
        let _guard: MutexGuard<()> = db_lock.lock().await;

        match conn
            .transaction(|connection| {
                async move {
                    diesel::insert_into(book_authors)
                        .values(new_item)
                        .execute(connection)
                        .await?;

                    Ok(())
                }
                .scope_boxed()
            })
            .await
        {
            Ok(_) => Ok(()),
            Err(e) => Err(e),
        }
    }

    async fn update<'a>(&self, _id: Self::Id, _updated_item: Self::Form<'a>) -> Result<(), Error> {
        // Junction tables typically don't support updates - delete and re-add instead
        Err(Error::NotFound)
    }

    async fn delete(&self, id: Self::Id) -> Result<(), Error> {
        use crate::data::models::schema::book_authors::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        let db_lock = lock_db();
        let _guard: MutexGuard<()> = db_lock.lock().await;

        match conn
            .transaction(|connection| {
                async move {
                    diesel::delete(book_authors.filter(book_id.eq(id.0).and(author_id.eq(id.1))))
                        .execute(connection)
                        .await?;
                    Ok(())
                }
                .scope_boxed()
            })
            .await
        {
            Ok(_) => Ok(()),
            Err(e) => Err(e),
        }
    }
}
