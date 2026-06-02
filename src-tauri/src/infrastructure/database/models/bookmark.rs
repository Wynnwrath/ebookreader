use crate::infrastructure::database::models::schema::bookmarks;
use diesel::prelude::*;

#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug)]
#[diesel(table_name = bookmarks)]
#[diesel(primary_key(bookmark_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct BookmarkRow {
    pub bookmark_id: Option<i32>,
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub position: String,
    pub created_at: Option<String>,
}

#[derive(Insertable, PartialEq, Debug)]
#[diesel(table_name = bookmarks)]
pub struct NewBookmarkRow<'a> {
    pub book_id: i32,
    pub chapter_title: Option<&'a str>,
    pub page_number: Option<i32>,
    pub position: &'a str,
}

impl From<BookmarkRow> for crate::domain::models::bookmark::Bookmark {
    fn from(row: BookmarkRow) -> Self {
        crate::domain::models::bookmark::Bookmark {
            id: row.bookmark_id.unwrap_or(0),
            book_id: row.book_id,
            chapter_title: row.chapter_title,
            page_number: row.page_number,
            position: row.position,
            created_at: row.created_at,
        }
    }
}
