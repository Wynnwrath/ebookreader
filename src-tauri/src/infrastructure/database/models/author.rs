use crate::infrastructure::database::models::schema::authors;
use diesel::prelude::*;

/// Diesel queryable row for the `authors` table.
#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug)]
#[diesel(table_name = authors)]
#[diesel(primary_key(author_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct AuthorRow {
    pub author_id: Option<i32>,
    pub name: String,
}

/// Insertable row for creating a new author record.
#[derive(Insertable, PartialEq, Debug)]
#[diesel(table_name = authors)]
pub struct NewAuthorRow<'a> {
    pub name: &'a str,
}

/// Converts a `AuthorRow` into a domain [`Author`](crate::domain::models::author::Author).
impl From<AuthorRow> for crate::domain::models::author::Author {
    fn from(row: AuthorRow) -> Self {
        crate::domain::models::author::Author {
            id: row.author_id.unwrap_or(0),
            name: row.name,
        }
    }
}
