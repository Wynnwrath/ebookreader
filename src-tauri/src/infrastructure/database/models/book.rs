use crate::infrastructure::database::models::schema::books;
use diesel::prelude::*;

#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug)]
#[diesel(table_name = books)]
#[diesel(primary_key(book_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct BookRow {
    pub book_id: i32,
    pub title: String,
    pub published_date: Option<String>,
    pub publisher_id: Option<i32>,
    pub isbn: Option<String>,
    pub file_type: String,
    pub file_path: String,
    pub cover_image_path: Option<String>,
    pub checksum: Option<String>,
    pub added_at: Option<String>,
}

#[derive(Insertable, PartialEq, Debug)]
#[diesel(table_name = books)]
pub struct NewBookRow<'a> {
    pub title: &'a str,
    pub published_date: Option<&'a str>,
    pub publisher_id: Option<i32>,
    pub isbn: Option<&'a str>,
    pub file_type: &'a str,
    pub file_path: &'a str,
    pub cover_image_path: Option<&'a str>,
    pub checksum: Option<&'a str>,
}

#[derive(AsChangeset, PartialEq, Debug)]
#[diesel(table_name = books)]
pub struct UpdateBookRow<'a> {
    pub title: Option<&'a str>,
    pub published_date: Option<&'a str>,
    pub publisher_id: Option<i32>,
    pub isbn: Option<&'a str>,
    pub file_type: Option<&'a str>,
    pub file_path: Option<&'a str>,
    pub cover_image_path: Option<&'a str>,
    pub checksum: Option<&'a str>,
}

impl From<&crate::domain::models::book::Book> for BookRow {
    fn from(book: &crate::domain::models::book::Book) -> Self {
        BookRow {
            book_id: book.id,
            title: book.title.clone(),
            published_date: book.published_date.clone(),
            publisher_id: book.publisher_id,
            isbn: book.isbn.clone(),
            file_type: book.file_type.clone().unwrap_or_default(),
            file_path: book.file_path.clone().unwrap_or_default(),
            cover_image_path: book.cover_image_path.clone(),
            checksum: book.checksum.clone(),
            added_at: book.added_at.clone(),
        }
    }
}

impl From<BookRow> for crate::domain::models::book::Book {
    fn from(row: BookRow) -> Self {
        crate::domain::models::book::Book {
            id: row.book_id,
            title: row.title,
            published_date: row.published_date,
            publisher_id: row.publisher_id,
            isbn: row.isbn,
            file_type: Some(row.file_type),
            file_path: Some(row.file_path),
            cover_image_path: row.cover_image_path,
            checksum: row.checksum,
            added_at: row.added_at,
        }
    }
}
