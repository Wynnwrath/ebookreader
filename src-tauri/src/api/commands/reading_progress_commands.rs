use crate::api::handlers;
use crate::application::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn update_reading_progress(
    book_id: i32,
    current_position: String,
    chapter_title: Option<String>,
    page_number: Option<i32>,
    progress_percentage: Option<f32>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    handlers::reading_progress_handler::update_progress(
        book_id,
        current_position,
        chapter_title,
        page_number,
        progress_percentage,
        &state,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_reading_progress(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Option<crate::domain::models::reading_progress::ReadingProgress>, String> {
    handlers::reading_progress_handler::get_progress(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}
