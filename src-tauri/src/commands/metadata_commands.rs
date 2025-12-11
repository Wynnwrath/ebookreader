use rbook::ebook::metadata;
use tauri::utils::config::parse;

use crate::data::models::books::{Books, UpdateBook};
use crate::data::repos::implementors::book_repo::BookRepo;
use crate::data::repos::traits::repository::Repository;
use crate::handlers::epub_handler::{parse_epub_meta, BookMetadata};

// Command list:
// - [x] Fetch metadata for a book by its name
// - [] Refresh metadata for a book (Not implemented - requires re-parsing)
// - [] Fetch certain metadata field for a book by its name (Not implemented - granular fetch)
// - [x] Update metadata for a book
// - [x] List all metadata entries (Lists all books)
// - [] Delete metadata entry by book name (Not implemented - requires defining what "delete metadata" means)

#[tauri::command]
pub async fn fetch_metadata(book_id: i32) -> Result<Option<BookMetadata>, String> {
    let repo = BookRepo::new().await;
    let books = repo.get_by_id(book_id).await.map_err(|e| e.to_string())?;

    let book = match books {
        Some(b) => b,
        None => return Ok(None),
    };

    let path = match book.file_path {
        Some(ref p) => p,
        None => return Err("Book file path not found".to_string()),
    };

    let metadata = parse_epub_meta(path.clone())
        .await
        .map_err(|e| e.to_string())?;

    Ok(Some(metadata))
}

#[tauri::command]
pub async fn list_metadata() -> Result<Vec<BookMetadata>, String> {
    let repo = BookRepo::new().await;
    let books = repo.get_all().await.map_err(|e| e.to_string())?;

    let book_list = match books {
        Some(b) => b,
        None => return Ok(vec![]),
    };

    let paths = book_list
        .iter()
        .filter_map(|book| book.file_path.clone())
        .collect::<Vec<String>>();

    let metadata_futures = paths
        .iter()
        .map(|path| async move { parse_epub_meta(path.clone()).await.unwrap() });

    let metadata_results = futures::future::join_all(metadata_futures).await;

    Ok(metadata_results)
}

#[tauri::command]
pub async fn update_metadata(
    book_name: String,
    title: Option<String>,
    published_date: Option<String>,
    isbn: Option<String>,
) -> Result<(), String> {
    let repo = BookRepo::new().await;
    if let Some(mut books) = repo
        .search_by_title(&book_name)
        .await
        .map_err(|e| e.to_string())?
    {
        if let Some(book) = books.pop() {
            let update = UpdateBook {
                title: title.as_deref(),
                published_date: published_date.as_deref(),
                publisher_id: None,
                isbn: isbn.as_deref(),
                file_type: None,
                file_path: None,
                cover_image_path: None,
                checksum: None,
            };
            repo.update(book.book_id, update)
                .await
                .map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("Book not found".to_string())
        }
    } else {
        Err("Book not found".to_string())
    }
}
