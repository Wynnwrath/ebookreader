use crate::data::models::schema::*;
use diesel::prelude::*;

#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug, serde::Serialize)]
#[diesel(table_name = reading_progress)]
#[diesel(primary_key(progress_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct ReadingProgress {
    pub progress_id: Option<i32>,
    pub user_id: i32,
    pub book_id: i32,
    pub current_position: String,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub progress_percentage: Option<f32>,
    pub last_read_at: Option<String>,
}

#[derive(Insertable, PartialEq, Debug)]
#[diesel(table_name = reading_progress)]
pub struct NewReadingProgress<'a> {
    pub user_id: i32,
    pub book_id: i32,
    pub current_position: &'a str,
    pub chapter_title: Option<&'a str>,
    pub page_number: Option<i32>,
    pub progress_percentage: Option<f32>,
}

#[derive(AsChangeset, PartialEq, Debug)]
#[diesel(table_name = reading_progress)]
pub struct UpdateReadingProgress<'a> {
    pub current_position: Option<&'a str>,
    pub chapter_title: Option<&'a str>,
    pub page_number: Option<i32>,
    pub progress_percentage: Option<f32>,
    pub last_read_at: Option<&'a str>,
}
