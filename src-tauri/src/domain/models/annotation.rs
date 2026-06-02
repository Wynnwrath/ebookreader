#[derive(Debug, Clone, serde::Serialize)]
pub struct Annotation {
    pub id: i32,
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
