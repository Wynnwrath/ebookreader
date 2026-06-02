#[derive(Debug, Clone, serde::Serialize)]
pub struct ReadingProgress {
    pub id: i32,
    pub book_id: i32,
    pub current_position: String,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub progress_percentage: Option<f32>,
    pub last_read_at: Option<String>,
}
