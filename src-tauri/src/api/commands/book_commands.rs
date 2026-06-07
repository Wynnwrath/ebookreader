use crate::api::handlers;
use crate::application::state::AppState;
use tauri::State;

/// Imports an ebook file at the given path into the library.
///
/// # Arguments
///
/// * `path` - Absolute path to the ebook file (`.epub` or `.pdf`).
///
/// # Returns
///
/// The imported book as a [`BookDto`](crate::domain::dto::book_dto::BookDto).
///
/// # Errors
///
/// Returns an error string if the file cannot be parsed, already exists
/// (duplicate checksum), or has an unsupported format.
#[tauri::command]
pub async fn import_book(
    path: String,
    state: State<'_, AppState>,
) -> Result<crate::domain::dto::book_dto::BookDto, String> {
    handlers::book_handler::import_book(path, &state)
        .await
        .map_err(|e| e.to_string())
}

/// Reads the full HTML content of an EPUB file.
///
/// # Arguments
///
/// * `path` - Absolute path to the EPUB file.
///
/// # Returns
///
/// A self-contained HTML string with inline base64 images.
#[tauri::command]
pub async fn read_epub(path: String) -> Result<String, String> {
    handlers::book_handler::read_epub(path)
        .await
        .map_err(|e| e.to_string())
}

/// Reads content from an ebook file, dispatching by file type.
///
/// # Arguments
///
/// * `path` - Absolute path to the ebook file.
/// * `file_type` - Either `"epub"` (returns HTML) or `"pdf"` (returns rendered page).
///
/// # Errors
///
/// Returns an error string for unsupported file types or parse failures.
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

/// Returns the total number of pages in a PDF file.
///
/// # Arguments
///
/// * `path` - Absolute path to the PDF file.
#[tauri::command]
pub async fn get_pdf_page_count(path: String) -> Result<u32, String> {
    handlers::book_handler::get_pdf_page_count(path)
        .await
        .map_err(|e| e.to_string())
}

/// Renders a specific page of a PDF.
///
/// # Arguments
///
/// * `path` - Absolute path to the PDF file.
/// * `page_number` - 0-based page index to render.
///
/// # Returns
///
/// A [`PdfPage`](crate::infrastructure::file_handlers::pdf_handler::PdfPage) with
/// base64 image data and text spans.
#[tauri::command]
pub async fn read_pdf_page(path: String, page_number: u32) -> Result<crate::infrastructure::file_handlers::pdf_handler::PdfPage, String> {
    handlers::book_handler::read_pdf_page(path, page_number)
        .await
        .map_err(|e| e.to_string())
}

/// Returns all books in the library.
///
/// # Returns
///
/// A vector of [`BookDto`](crate::domain::dto::book_dto::BookDto) for every
/// book, each resolved with author and publisher names.
#[tauri::command]
pub async fn list_books(
    state: State<'_, AppState>,
) -> Result<Vec<crate::domain::dto::book_dto::BookDto>, String> {
    handlers::book_handler::list_books(&state)
        .await
        .map_err(|e| e.to_string())
}

/// Returns details for a single book by ID.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
///
/// # Returns
///
/// `Some(BookDto)` if found, `None` otherwise.
#[tauri::command]
pub async fn get_book_details(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Option<crate::domain::dto::book_dto::BookDto>, String> {
    handlers::book_handler::get_book_details(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

/// Returns the cover image bytes for a book.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
///
/// # Returns
///
/// `Some(bytes)` with the raw cover image, or `None` if unavailable.
#[tauri::command]
pub async fn get_cover_img(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Option<Vec<u8>>, String> {
    handlers::book_handler::get_cover_img(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

/// Removes a book from the library by ID.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
#[tauri::command]
pub async fn remove_book(book_id: i32, state: State<'_, AppState>) -> Result<(), String> {
    handlers::book_handler::remove_book(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}
