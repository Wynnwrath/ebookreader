use crate::infrastructure::database::models::schema::publishers;
use diesel::prelude::*;

#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug)]
#[diesel(table_name = publishers)]
#[diesel(primary_key(publisher_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct PublisherRow {
    pub publisher_id: i32,
    pub name: String,
}

impl From<PublisherRow> for crate::domain::models::publisher::Publisher {
    fn from(row: PublisherRow) -> Self {
        crate::domain::models::publisher::Publisher {
            id: row.publisher_id,
            name: row.name,
        }
    }
}
