use async_trait::async_trait;
use diesel::prelude::*;
use diesel_async::{AsyncConnection, RunQueryDsl};

use crate::domain::error::DomainError;
use crate::domain::models::publisher::Publisher;
use crate::domain::repository::PublisherRepository;
use crate::infrastructure::database::database::{connect_from_pool, lock_db};
use crate::infrastructure::database::models::publisher::PublisherRow;
use crate::infrastructure::database::models::schema::publishers;

pub struct PublisherRepoImpl;

impl PublisherRepoImpl {
    pub fn new() -> Self {
        Self
    }
}

impl Default for PublisherRepoImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl PublisherRepository for PublisherRepoImpl {
    async fn find_by_id(&self, find_id: i32) -> Result<Option<Publisher>, DomainError> {
        let mut conn = connect_from_pool().await?;

        let rows = publishers::dsl::publishers
            .filter(publishers::publisher_id.eq(find_id))
            .limit(1)
            .load::<PublisherRow>(&mut conn)
            .await?;
        match rows.into_iter().next() {
            Some(row) => Ok(Some(Publisher::from(row))),
            None => Ok(None),
        }
    }

    async fn find_or_create(&self, publisher_name: &str) -> Result<Publisher, DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        // Check if publisher exists
        let existing = publishers::dsl::publishers
            .filter(publishers::name.eq(publisher_name))
            .limit(1)
            .load::<PublisherRow>(&mut conn)
            .await?;

        if let Some(row) = existing.into_iter().next() {
            return Ok(Publisher::from(row));
        }

        // Insert new publisher
        conn.transaction(async |connection| {
            diesel::insert_into(publishers::table)
                .values(publishers::name.eq(publisher_name))
                .execute(connection)
                .await?;
            Ok::<(), diesel::result::Error>(())
        })
        .await?;

        // Return the newly created publisher
        let rows = publishers::dsl::publishers
            .filter(publishers::name.eq(publisher_name))
            .limit(1)
            .load::<PublisherRow>(&mut conn)
            .await?;

        rows.into_iter().next().map(Publisher::from).ok_or_else(|| {
            DomainError::Database("Failed to retrieve newly created publisher".into())
        })
    }
}
