use crate::infrastructure::database::models::schema::reading_progress;
use diesel::prelude::*;

/// Diesel queryable row for the `reading_progress` table.
#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug)]
#[diesel(table_name = reading_progress)]
#[diesel(primary_key(progress_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct ReadingProgressRow {
    pub progress_id: Option<i32>,
    pub book_id: i32,
    pub current_position: String,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub progress_percentage: Option<f32>,
    pub last_read_at: Option<String>,
}

/// Insertable row for creating or upserting reading progress.
#[derive(Insertable, PartialEq, Debug)]
#[diesel(table_name = reading_progress)]
pub struct NewReadingProgressRow<'a> {
    pub book_id: i32,
    pub current_position: &'a str,
    pub chapter_title: Option<&'a str>,
    pub page_number: Option<i32>,
    pub progress_percentage: Option<f32>,
}

/// Converts a `ReadingProgressRow` into a domain [`ReadingProgress`](crate::domain::models::reading_progress::ReadingProgress).
impl From<ReadingProgressRow> for crate::domain::models::reading_progress::ReadingProgress {
    fn from(row: ReadingProgressRow) -> Self {
        crate::domain::models::reading_progress::ReadingProgress {
            id: row.progress_id.unwrap_or(0),
            book_id: row.book_id,
            current_position: row.current_position,
            chapter_title: row.chapter_title,
            page_number: row.page_number,
            progress_percentage: row.progress_percentage,
            last_read_at: row.last_read_at,
        }
    }
}
