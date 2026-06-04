use crate::api::handlers;
use crate::application::state::AppState;
use crate::infrastructure::file_handlers::BookMetadata;
use tauri::State;

/// Re-parses the ebook file for a book and returns fresh metadata.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
///
/// # Returns
///
/// `Some(BookMetadata)` if the book exists and its file can be read,
/// `None` if the book ID is not found.
#[tauri::command]
pub async fn fetch_metadata(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Option<BookMetadata>, String> {
    handlers::metadata_handler::fetch_metadata(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

/// Re-parses every book in the library and returns their metadata.
///
/// # Returns
///
/// A vector of [`BookMetadata`] for all books whose files could be read.
#[tauri::command]
pub async fn list_metadata(state: State<'_, AppState>) -> Result<Vec<BookMetadata>, String> {
    handlers::metadata_handler::list_metadata(&state)
        .await
        .map_err(|e| e.to_string())
}

/// Updates metadata fields for a book found by title search.
///
/// # Arguments
///
/// * `book_name` - Substring to search book titles against.
/// * `title` - Optional new title.
/// * `published_date` - Optional new publication date.
/// * `isbn` - Optional new ISBN.
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
