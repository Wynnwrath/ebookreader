use crate::data::models::schema::*;
use diesel::prelude::*;

#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug, serde::Serialize)]
#[diesel(table_name = bookmarks)]
#[diesel(primary_key(bookmark_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Bookmarks {
    pub bookmark_id: Option<i32>,
    pub user_id: i32,
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub position: String,
    pub created_at: Option<String>,
}

#[derive(Insertable, PartialEq, Debug)]
#[diesel(table_name = bookmarks)]
pub struct NewBookmark<'a> {
    pub user_id: i32,
    pub book_id: i32,
    pub chapter_title: Option<&'a str>,
    pub page_number: Option<i32>,
    pub position: &'a str,
}

#[derive(AsChangeset, PartialEq, Debug)]
#[diesel(table_name = bookmarks)]
pub struct UpdateBookmark<'a> {
    pub chapter_title: Option<&'a str>,
    pub page_number: Option<i32>,
    pub position: Option<&'a str>,
}
