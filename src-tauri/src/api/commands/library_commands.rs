use crate::api::handlers;
use crate::application::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn scan_books_directory(
    directory_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    handlers::library_handler::scan_directory(directory_path, &state)
        .await
        .map_err(|e| e.to_string())
}
