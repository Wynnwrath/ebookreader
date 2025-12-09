use diesel::prelude::*;

use crate::data::models::schema::*;

#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug, serde::Serialize)]
#[diesel(table_name = books)]
#[diesel(primary_key(book_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Books {
    pub book_id: i32,
    pub title: String,
    pub published_date: Option<String>,
    pub publisher_id: Option<i32>,
    pub isbn: Option<String>,
    pub file_type: Option<String>,
    pub file_path: Option<String>,
    pub cover_image_path: Option<String>,
    pub checksum: Option<String>,
    pub added_at: Option<String>,
}

#[derive(Insertable, PartialEq, Debug)]
#[diesel(table_name = books)]
pub struct NewBook<'a> {
    pub title: &'a str,
    pub published_date: Option<&'a str>,
    pub publisher_id: Option<i32>,
    pub isbn: Option<&'a str>,
    pub file_type: Option<&'a str>,
    pub file_path: Option<&'a str>,
    pub cover_image_path: Option<&'a str>,
    pub checksum: Option<&'a str>,
}

#[derive(AsChangeset, PartialEq, Debug)]
#[diesel(table_name = books)]
pub struct UpdateBook<'a> {
    pub title: Option<&'a str>,
    pub published_date: Option<&'a str>,
    pub publisher_id: Option<i32>,
    pub isbn: Option<&'a str>,
    pub file_type: Option<&'a str>,
    pub file_path: Option<&'a str>,
    pub cover_image_path: Option<&'a str>,
    pub checksum: Option<&'a str>,
}
