use async_trait::async_trait;
use diesel::prelude::*;
use diesel::result::{DatabaseErrorKind, Error};
use diesel_async::scoped_futures::ScopedFutureExt;
use diesel_async::{AsyncConnection, RunQueryDsl};
use tokio::sync::MutexGuard;

use crate::data::{
    database::{connect_from_pool, lock_db},
    models::{
        books::Books,
        user_library::{NewUserLibrary, UserLibrary},
    },
    repos::traits::repository::Repository,
};

pub struct UserLibraryRepo;

impl UserLibraryRepo {
    pub async fn new() -> Self {
        UserLibraryRepo
    }

    pub async fn get_library_by_user(&self, uid: i32) -> Result<Option<Vec<UserLibrary>>, Error> {
        use crate::data::models::schema::user_library::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        return match user_library
            .filter(user_id.eq(uid))
            .load::<UserLibrary>(&mut conn)
            .await
        {
            Ok(value) if value.is_empty() => Ok(None),
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        };
    }

    pub async fn get_books_by_user(&self, uid: i32) -> Result<Option<Vec<Books>>, Error> {
        use crate::data::models::schema::{books, user_library};

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        return match user_library::table
            .inner_join(books::table.on(books::book_id.eq(user_library::book_id)))
            .filter(user_library::user_id.eq(uid))
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
impl Repository for UserLibraryRepo {
    type Item = UserLibrary;
    type NewItem<'a> = NewUserLibrary;
    type Form<'a> = UserLibrary; // No separate update form needed
    type Id = (i32, i32); // Tuple: (user_id, book_id)

    async fn get_all(&self) -> Result<Option<Vec<Self::Item>>, Error> {
        use crate::data::models::schema::user_library::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match user_library.load::<Self::Item>(&mut conn).await {
            Ok(value) if value.is_empty() => Ok(None),
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }

    async fn get_by_id(&self, id: Self::Id) -> Result<Option<Self::Item>, Error> {
        use crate::data::models::schema::user_library::dsl::*;

        let mut conn = connect_from_pool().await.map_err(|e| {
            Error::DatabaseError(
                DatabaseErrorKind::UnableToSendCommand,
                Box::new(e.to_string()),
            )
        })?;

        match user_library
            .filter(user_id.eq(id.0).and(book_id.eq(id.1)))
            .first::<UserLibrary>(&mut conn)
            .await
        {
            Ok(value) => Ok(Some(value)),
            Err(Error::NotFound) => Ok(None),
            Err(e) => Err(e),
        }
    }

    async fn add<'a>(&self, new_item: Self::NewItem<'a>) -> Result<(), Error> {
        use crate::data::models::schema::user_library::dsl::*;

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
                    diesel::insert_into(user_library)
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
        // If you need to update added_at, you would need a different approach
        Err(Error::NotFound)
    }

    async fn delete(&self, id: Self::Id) -> Result<(), Error> {
        use crate::data::models::schema::user_library::dsl::*;

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
                    diesel::delete(user_library.filter(user_id.eq(id.0).and(book_id.eq(id.1))))
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
