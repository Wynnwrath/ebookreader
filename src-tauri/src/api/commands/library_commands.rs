use crate::api::handlers;
use crate::application::state::AppState;
use tauri::State;

/// Recursively scans a directory for ebooks and imports them into the library.
///
/// # Arguments
///
/// * `directory_path` - Absolute path to the directory to scan.
///
/// # Returns
///
/// A list of error messages for files that failed to import.
#[tauri::command]
pub async fn scan_books_directory(
    directory_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    handlers::library_handler::scan_directory(directory_path, &state)
        .await
        .map_err(|e| e.to_string())
}
