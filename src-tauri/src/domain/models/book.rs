#[derive(Debug, Clone)]
pub struct Book {
    pub id: i32,
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
