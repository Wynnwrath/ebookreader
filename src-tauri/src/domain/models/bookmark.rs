#[derive(Debug, Clone, serde::Serialize)]
pub struct Bookmark {
    pub id: i32,
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub position: String,
    pub created_at: Option<String>,
}
