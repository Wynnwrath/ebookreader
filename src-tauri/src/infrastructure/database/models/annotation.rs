use crate::infrastructure::database::models::schema::annotations;
use diesel::prelude::*;

#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug)]
#[diesel(table_name = annotations)]
#[diesel(primary_key(annotation_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct AnnotationRow {
    pub annotation_id: Option<i32>,
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
pub struct NewAnnotationRow<'a> {
    pub book_id: i32,
    pub chapter_title: Option<&'a str>,
    pub start_position: &'a str,
    pub end_position: &'a str,
    pub highlighted_text: Option<&'a str>,
    pub note: Option<&'a str>,
    pub color: Option<&'a str>,
}

impl From<AnnotationRow> for crate::domain::models::annotation::Annotation {
    fn from(row: AnnotationRow) -> Self {
        crate::domain::models::annotation::Annotation {
            id: row.annotation_id.unwrap_or(0),
            book_id: row.book_id,
            chapter_title: row.chapter_title,
            start_position: row.start_position,
            end_position: row.end_position,
            highlighted_text: row.highlighted_text,
            note: row.note,
            color: row.color,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}
