use crate::infrastructure::database::models::schema::publishers;
use diesel::prelude::*;

/// Diesel queryable row for the `publishers` table.
#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug)]
#[diesel(table_name = publishers)]
#[diesel(primary_key(publisher_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct PublisherRow {
    pub publisher_id: Option<i32>,
    pub name: String,
}

/// Converts a `PublisherRow` into a domain [`Publisher`](crate::domain::models::publisher::Publisher).
impl From<PublisherRow> for crate::domain::models::publisher::Publisher {
    fn from(row: PublisherRow) -> Self {
        crate::domain::models::publisher::Publisher {
            id: row.publisher_id.unwrap_or(0),
            name: row.name,
        }
    }
}
