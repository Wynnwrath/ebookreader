use crate::data::models::annotations::Annotations;
use crate::data::models::bookmarks::Bookmarks;
use crate::data::models::books::Books;
use crate::data::repos::implementors::book_repo::BookRepo;
use crate::data::repos::implementors::reading_progress_repo::ReadingProgressRepo;
use crate::data::repos::traits::repository::Repository;
use crate::handlers::epub_handler::get_cover_image_streamed;
use crate::services::book_service::{
    add_annotation as service_add_annotation, add_book_from_file,
    add_bookmark as service_add_bookmark, add_books_from_dir,
    delete_annotation as service_delete_annotation, delete_bookmark as service_delete_bookmark,
    get_annotations as service_get_annotations, get_bookmarks as service_get_bookmarks,
    get_epub_content,
};
use crate::utils::response::BookResponse;
use std::path::Path;

/// Command to import an EPUB from a given file path
/// Returns true if the import is successful, errors as strings otherwise
/// # Arguments
/// * `path` - A string slice that holds the file path of the EPUB to import
/// # Returns
/// * `Result<bool, String>` - On success, returns true; on failure, returns an error message
#[tauri::command]
pub async fn import_book(path: &str) -> Result<bool, String> {
    let path = Path::new(path);
    add_book_from_file(path.to_path_buf())
        .await
        .map_err(|e| e.to_string())?;

    Ok(true)
}

/// Command to read EPUB content from a given file path
/// Returns the content as a string if successful, errors as strings otherwise
/// # Arguments
/// * `path` - A string slice that holds the file path of the EPUB to read
/// # Returns
/// * `Result<String, String>` - On success, returns the EPUB content as an HTML; on failure, returns an error message
#[tauri::command]
pub async fn read_epub(path: &str) -> Result<String, String> {
    get_epub_content(path).await.map_err(|e| e.to_string())
}

/// Command to list all books in the database
/// Returns a vector of Books if successful, errors as strings otherwise
/// # Returns
/// * `Result<Vec<Books>, String>` - On success, returns a vector of Books; on failure, returns an error message
/// Refer to `Books` struct in `data::models::books` for book details structure.
#[tauri::command]
pub async fn list_books() -> Result<Vec<BookResponse>, String> {
    let repo = BookRepo::new().await;
    let books_list = repo.get_all().await.map_err(|e| e.to_string())?;

    let book_responses = match books_list {
        Some(books) => {
            let mut responses = Vec::new();
            for book in books {
                let response = BookResponse::from_book(book)
                    .await
                    .map_err(|e| e.to_string())?;
                responses.push(response);
            }
            responses
        }
        None => Vec::new(),
    };
    Ok(book_responses)
}

/// Command to get book details by book ID
/// Returns book details if found, otherwise returns an error message
/// # Arguments
/// * `book_id` - An integer that holds the ID of the book to fetch
/// # Returns
/// * `Result<Option<Books>, String>` - On success, returns the book details; on failure, returns an error message
/// Refer to `Books` struct in `data::models::books` for book details structure.
/// NOTE: Option is used to handle cases where the book may not be found.
#[tauri::command]
pub async fn get_book_details(book_id: i32) -> Result<Option<BookResponse>, String> {
    let repo = BookRepo::new().await;
    let book = repo.get_by_id(book_id).await.map_err(|e| e.to_string())?;

    match book {
        Some(b) => {
            let response = BookResponse::from_book(b)
                .await
                .map_err(|e| e.to_string())?;
            Ok(Some(response))
        }
        None => Ok(None),
    }
}

/// Command to add a bookmark for a user in a specific book
/// Returns void if the addition is successful, errors as strings otherwise
/// # Arguments
/// * `user_id` - An integer that holds the ID of the user
/// * `book_id` - An integer that holds the ID of the book
/// * `position` - A string that holds the position in the book (e.g., chapter or page)
/// * `chapter_title` - An optional string that holds the title of the chapter
/// * `page_number` - An optional integer that holds the page number
/// # Returns
/// * `Result<(), String>` - On success, returns (); on failure, returns an error message
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

/// Command to get all bookmarks for a user in a specific book
/// Returns a vector of Bookmarks if successful, errors as strings otherwise
/// # Arguments
/// * `user_id` - An integer that holds the ID of the user
/// * `book_id` - An integer that holds the ID of the book
/// # Returns
/// * `Result<Vec<Bookmarks>, String>` - On success, returns a vector of Bookmarks; on failure, returns an error message
#[tauri::command]
pub async fn get_bookmarks(user_id: i32, book_id: i32) -> Result<Vec<Bookmarks>, String> {
    let bookmarks = service_get_bookmarks(user_id, book_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(bookmarks.unwrap_or_default())
}

/// Command to delete a bookmark by its ID
/// Returns void if the deletion is successful, errors as strings otherwise
/// # Arguments
/// * `bookmark_id` - An integer that holds the ID of the bookmark to delete
/// # Returns
/// * `Result<(), String>` - On success, returns (); on failure, returns an error message
#[tauri::command]
pub async fn delete_bookmark(bookmark_id: i32) -> Result<(), String> {
    service_delete_bookmark(bookmark_id)
        .await
        .map_err(|e| e.to_string())
}

/// Command to add an annotation for a user in a specific book
/// Returns void if the addition is successful, errors as strings otherwise
/// # Arguments
/// * `user_id` - An integer that holds the ID of the user
/// * `book_id` - An integer that holds the ID of the book
/// * `start_position` - A string that holds the start position of the annotation
/// * `end_position` - A string that holds the end position of the annotation
/// * `chapter_title` - An optional string that holds the title of the chapter
/// * `highlighted_text` - An optional string that holds the highlighted text
/// * `note` - An optional string that holds the note for the annotation
/// * `color` - An optional string that holds the color of the annotation
/// # Returns
/// * `Result<(), String>` - On success, returns (); on failure, returns an error message
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

/// Command to get all annotations for a user in a specific book
/// Returns a vector of Annotations if successful, errors as strings otherwise
/// # Arguments
/// * `user_id` - An integer that holds the ID of the user
/// * `book_id` - An integer that holds the ID of the book
/// # Returns
/// * `Result<Vec<Annotations>, String>` - On success, returns a vector of Annotations; on failure, returns an error message
#[tauri::command]
pub async fn get_annotations(user_id: i32, book_id: i32) -> Result<Vec<Annotations>, String> {
    let annotations = service_get_annotations(user_id, book_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(annotations.unwrap_or_default())
}

/// Command to delete an annotation by its ID
/// Returns void if the deletion is successful, errors as strings otherwise
/// # Arguments
/// * `annotation_id` - An integer that holds the ID of the annotation to delete
/// # Returns
/// * `Result<(), String>` - On success, returns (); on failure, returns an error message
#[tauri::command]
pub async fn delete_annotation(annotation_id: i32) -> Result<(), String> {
    service_delete_annotation(annotation_id)
        .await
        .map_err(|e| e.to_string())
}

/// Command to scan a directory for books and add them to the database
/// Returns void if the scan is successful, errors as strings otherwise
/// # Arguments
/// * `directory_path` - A string slice that holds the path of the directory to scan
/// # Returns
/// * `Result<(), String>` - On success, returns (); on failure, returns an error message
#[tauri::command]
pub async fn scan_books_directory(directory_path: &str) -> Result<(), String> {
    let path = Path::new(directory_path);

    add_books_from_dir(path.to_path_buf()).await;

    Ok(())
}

/// Command to check if book is already read
/// Returns true if the book is read, false otherwise
/// # Arguments
/// * `user_id` - An integer that holds the ID of the user
/// * `book_id` - An integer that holds the ID of the book
/// # Returns
/// * `Result<bool, String>` - On success, returns true if read, false otherwise
#[tauri::command]
pub async fn is_book_read(user_id: i32, book_id: i32) -> Result<bool, String> {
    let repo = ReadingProgressRepo::new().await;
    match repo
        .get_by_user_and_book(user_id, book_id)
        .await
        .map_err(|e| e.to_string())
    {
        Ok(Some(_)) => Ok(true),
        Ok(None) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}

/// Command to get the cover image of a book by its ID
/// Returns the cover image as a byte vector if found, otherwise returns None
/// # Arguments
/// * `book_id` - An integer that holds the ID of the book
/// # Returns
/// * `Result<Option<Vec<u8>>, String>` - On success, returns Some(byte vector) if found, None otherwise; on failure, returns an error message
#[tauri::command]
pub async fn get_cover_img(book_id: i32) -> Result<Option<Vec<u8>>, String> {
    let repo = BookRepo::new().await;
    let book: Books = match repo.get_by_id(book_id).await.map_err(|e| e.to_string())? {
        Some(book) => Ok(book),
        None => Err(String::from("Book not found")),
    }?;

    match get_cover_image_streamed(book.book_id)
        .await
        .map_err(|e| e.to_string())
    {
        Ok(img) => Ok(Some(img)),
        Err(_) => Ok(None),
    }
}

/// Command to remove a book by its ID
/// Returns void if the removal is successful, errors as strings otherwise
/// # Arguments
/// * `book_id` - An integer that holds the ID of the book to remove
/// # Returns
/// * `Result<(), String>` - On success, returns (); on failure, returns an error message
#[tauri::command]
pub async fn remove_book(book_id: i32) -> Result<bool, String> {
    let repo = BookRepo::new().await;
    repo.delete(book_id).await.map_err(|e| e.to_string())?;

    Ok(true)
}
