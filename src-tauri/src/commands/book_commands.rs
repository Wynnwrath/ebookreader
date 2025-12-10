use crate::data::models::annotations::Annotations;
use crate::data::models::bookmarks::Bookmarks;
use crate::data::models::books::Books;
use crate::data::repos::implementors::book_repo::BookRepo;
use crate::data::repos::traits::repository::Repository;
use crate::services::book_service::{add_annotation as service_add_annotation, add_book_from_file, add_bookmark as service_add_bookmark, add_books_from_dir, delete_annotation as service_delete_annotation, delete_bookmark as service_delete_bookmark, get_annotations as service_get_annotations, get_bookmarks as service_get_bookmarks, get_epub_content};
use std::path::Path;

// Command list:
// - [x] Import book from file path
// - [x] Read EPUB content from file path
// - [x] List all books
// - [x] Get book details by ID
// - [x] Add bookmark to book
// - [x] Get bookmarks for a book
// - [x] Delete bookmark by ID
// - [x] Add annotation to book
// - [x] Get annotations for a book
// - [x] Delete annotation by ID

/// Command to import an EPUB from a given file path
#[tauri::command]
pub async fn import_book(path: &str) -> Result<String, String> {
    let path = Path::new(path);
    add_book_from_file(path.to_path_buf())
        .await
        .map_err(|e| e.to_string())?;

    Ok("Book imported successfully".to_string())
}

/// Command to read EPUB content from a given file path
#[tauri::command]
pub async fn read_epub(path: &str) -> Result<String, String> {
    get_epub_content(path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_books() -> Result<Vec<Books>, String> {
    let repo = BookRepo::new().await;
    let books = repo.get_all().await.map_err(|e| e.to_string())?;
    Ok(books.unwrap_or_default())
}

#[tauri::command]
pub async fn get_book_details(book_id: i32) -> Result<Option<Books>, String> {
    let repo = BookRepo::new().await;
    repo.get_by_id(book_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_bookmark(
    user_id: i32,
    book_id: i32,
    position: String,
    chapter_title: Option<String>,
    page_number: Option<i32>,
) -> Result<(), String> {
    service_add_bookmark(
        user_id,
        book_id,
        &position,
        chapter_title.as_deref(),
        page_number,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_bookmarks(user_id: i32, book_id: i32) -> Result<Vec<Bookmarks>, String> {
    let bookmarks = service_get_bookmarks(user_id, book_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(bookmarks.unwrap_or_default())
}

#[tauri::command]
pub async fn delete_bookmark(bookmark_id: i32) -> Result<(), String> {
    service_delete_bookmark(bookmark_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_annotation(
    user_id: i32,
    book_id: i32,
    start_position: String,
    end_position: String,
    chapter_title: Option<String>,
    highlighted_text: Option<String>,
    note: Option<String>,
    color: Option<String>,
) -> Result<(), String> {
    service_add_annotation(
        user_id,
        book_id,
        &start_position,
        &end_position,
        chapter_title.as_deref(),
        highlighted_text.as_deref(),
        note.as_deref(),
        color.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_annotations(user_id: i32, book_id: i32) -> Result<Vec<Annotations>, String> {
    let annotations = service_get_annotations(user_id, book_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(annotations.unwrap_or_default())
}

#[tauri::command]
pub async fn delete_annotation(annotation_id: i32) -> Result<(), String> {
    service_delete_annotation(annotation_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_books_directory(directory_path: &str) -> Result<(), String> {
    let path = Path::new(directory_path);

    add_books_from_dir(path.to_path_buf()).await;

    Ok(())
}
