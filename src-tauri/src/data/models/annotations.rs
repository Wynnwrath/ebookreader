use crate::data::models::schema::*;
use diesel::prelude::*;

#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug, serde::Serialize)]
#[diesel(table_name = annotations)]
#[diesel(primary_key(annotation_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Annotations {
    pub annotation_id: Option<i32>,
    pub user_id: i32,
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub start_position: String,
    pub end_position: String,
    pub highlighted_text: Option<String>,
    pub note: Option<String>,
    pub color: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Insertable, PartialEq, Debug)]
#[diesel(table_name = annotations)]
pub struct NewAnnotation<'a> {
    pub user_id: i32,
    pub book_id: i32,
    pub chapter_title: Option<&'a str>,
    pub start_position: &'a str,
    pub end_position: &'a str,
    pub highlighted_text: Option<&'a str>,
    pub note: Option<&'a str>,
    pub color: Option<&'a str>,
}

#[derive(AsChangeset, PartialEq, Debug)]
#[diesel(table_name = annotations)]
pub struct UpdateAnnotation<'a> {
    pub chapter_title: Option<&'a str>,
    pub start_position: Option<&'a str>,
    pub end_position: Option<&'a str>,
    pub highlighted_text: Option<&'a str>,
    pub note: Option<&'a str>,
    pub color: Option<&'a str>,
    pub updated_at: Option<&'a str>,
}
