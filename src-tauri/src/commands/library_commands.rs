use crate::data::models::books::Books;
use crate::data::models::user_library::NewUserLibrary;
use crate::data::repos::implementors::user_library_repo::UserLibraryRepo;
use crate::data::repos::traits::repository::Repository;

// Command list for User Library Management:
// - [x] Add a book to a user's library
// - [x] List all books in a user's library
// - [x] Remove a book from a user's library
// NOTE: "Libraries" in this context refers to a user's collection of books, not physical directories.

/// Command to add a book to a user's library.
/// Requires a user ID and a book ID.
#[tauri::command]
pub async fn add_book_to_user_library(user_id: i32, book_id: i32) -> Result<(), String> {
    let repo = UserLibraryRepo::new().await;
    let new_user_library_entry = NewUserLibrary { user_id, book_id };
    repo.add(new_user_library_entry)
        .await
        .map_err(|e| e.to_string())
}

/// Command to list all books in a user's library.
/// Requires a user ID.
#[tauri::command]
pub async fn list_user_library_books(user_id: i32) -> Result<Vec<Books>, String> {
    let repo = UserLibraryRepo::new().await;
    let books = repo
        .get_books_by_user(user_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(books.unwrap_or_default())
}

/// Command to remove a book from a user's library.
/// Requires a user ID and a book ID.
#[tauri::command]
pub async fn remove_book_from_user_library(user_id: i32, book_id: i32) -> Result<(), String> {
    let repo = UserLibraryRepo::new().await;
    repo.delete((user_id, book_id))
        .await
        .map_err(|e| e.to_string())
}
