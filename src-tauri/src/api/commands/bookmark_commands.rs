use crate::api::handlers;
use crate::application::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn add_bookmark(
    book_id: i32,
    position: String,
    chapter_title: Option<String>,
    page_number: Option<i32>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    handlers::bookmark_handler::add_bookmark(book_id, position, chapter_title, page_number, &state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_bookmarks(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Vec<crate::domain::models::bookmark::Bookmark>, String> {
    handlers::bookmark_handler::get_bookmarks(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_bookmark(bookmark_id: i32, state: State<'_, AppState>) -> Result<(), String> {
    handlers::bookmark_handler::delete_bookmark(bookmark_id, &state)
        .await
        .map_err(|e| e.to_string())
}
