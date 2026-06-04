use crate::api::handlers;
use crate::application::state::AppState;
use crate::infrastructure::file_handlers::BookMetadata;
use tauri::State;

#[tauri::command]
pub async fn fetch_metadata(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Option<BookMetadata>, String> {
    handlers::metadata_handler::fetch_metadata(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_metadata(state: State<'_, AppState>) -> Result<Vec<BookMetadata>, String> {
    handlers::metadata_handler::list_metadata(&state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_metadata(
    book_name: String,
    title: Option<String>,
    published_date: Option<String>,
    isbn: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    handlers::metadata_handler::update_metadata(book_name, title, published_date, isbn, &state)
        .await
        .map_err(|e| e.to_string())
}
