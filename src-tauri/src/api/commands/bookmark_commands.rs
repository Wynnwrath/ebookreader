use crate::api::handlers;
use crate::application::state::AppState;
use tauri::State;

/// Creates a new bookmark for a book at the given position.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
/// * `position` - Position identifier (e.g., EPUB CFI, byte offset).
/// * `chapter_title` - Optional chapter title.
/// * `page_number` - Optional page number (PDF books).
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

/// Returns all bookmarks for the given book.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
#[tauri::command]
pub async fn get_bookmarks(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Vec<crate::domain::models::bookmark::Bookmark>, String> {
    handlers::bookmark_handler::get_bookmarks(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

/// Deletes a bookmark by ID.
///
/// # Arguments
///
/// * `bookmark_id` - The bookmark's database ID.
#[tauri::command]
pub async fn delete_bookmark(bookmark_id: i32, state: State<'_, AppState>) -> Result<(), String> {
    handlers::bookmark_handler::delete_bookmark(bookmark_id, &state)
        .await
        .map_err(|e| e.to_string())
}
