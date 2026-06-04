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
pub async fn read_book(
    path: String,
    file_type: String,
) -> Result<crate::application::book::BookContent, String> {
    match file_type.as_str() {
        "epub" | "pdf" => {}
        _ => return Err(format!("Unsupported file type: {}", file_type)),
    }
    handlers::book_handler::read_book(path, file_type)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_pdf_page_count(path: String) -> Result<u32, String> {
    handlers::book_handler::get_pdf_page_count(path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_pdf_page(path: String, page_number: u32) -> Result<crate::infrastructure::file_handlers::pdf_handler::PdfPage, String> {
    handlers::book_handler::read_pdf_page(path, page_number)
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
