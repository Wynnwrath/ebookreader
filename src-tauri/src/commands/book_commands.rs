use std::path::Path;
use crate::services::book_service::add_book_from_file;

// Put command implementations related to book management to be used on the tauri frontend here
/// Command to import an EPUB from a given file path
/// # Arguments
/// * `path` - A string slice that holds the path to the book file
/// # Returns
/// * `Result<String, String>` - Ok with success message or Err with error message
#[tauri::command]
pub async fn import_book(
    path: &str
) -> Result<String, String> {
    let path = Path::new(path);
    add_book_from_file(path.to_path_buf()).await.map_err(|e| e.to_string()).expect("Failed to import book");

    Ok("Book imported successfully".to_string())
}
/// Command to read EPUB content from a given file path
/// # Arguments
/// * `path` - A string slice that holds the path to the EPUB file
/// # Returns
/// * `Result<String, String>` - Ok with EPUB content or Err with error message
#[tauri::command]
pub async fn read_epub(path: &str) -> Result<String, String> {
    let content = crate::services::book_service::get_epub_content(path)
        .await
        .map_err(|e| e.to_string())?;
    Ok(content)
}

// TODO: Commands to list books, get book details, manage bookmarks and annotations, etc.
