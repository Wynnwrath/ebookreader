use crate::api::handlers;
use crate::application::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn import_book(
    path: String,
    state: State<'_, AppState>,
) -> Result<crate::domain::dto::book_dto::BookDto, String> {
    handlers::book_handler::import_book(path, &state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_epub(path: String) -> Result<String, String> {
    handlers::book_handler::read_epub(path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_books(
    state: State<'_, AppState>,
) -> Result<Vec<crate::domain::dto::book_dto::BookDto>, String> {
    handlers::book_handler::list_books(&state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_book_details(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Option<crate::domain::dto::book_dto::BookDto>, String> {
    handlers::book_handler::get_book_details(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_cover_img(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Option<Vec<u8>>, String> {
    handlers::book_handler::get_cover_img(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_book(book_id: i32, state: State<'_, AppState>) -> Result<(), String> {
    handlers::book_handler::remove_book(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}
