use crate::infrastructure::database::models::schema::book_authors;
use diesel::prelude::*;

/// Diesel row for the `book_authors` many-to-many join table.
#[derive(Queryable, Identifiable, PartialEq, Insertable, Debug)]
#[diesel(table_name = book_authors)]
#[diesel(primary_key(book_id, author_id))]
pub struct BookAuthorRow {
    pub book_id: i32,
    pub author_id: i32,
}
