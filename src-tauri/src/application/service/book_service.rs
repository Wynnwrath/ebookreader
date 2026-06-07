use crate::domain::repository::BookRepository;
use crate::infrastructure::file_handlers::BookMetadata;
use std::sync::Arc;

/// Re-parses the original ebook file for a book and returns fresh metadata.
///
/// Useful for verifying or refreshing metadata without re-importing.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
/// * `book_repo` - Repository for looking up the book record.
///
/// # Returns
///
/// `Ok(None)` if no book has the given ID. Otherwise the freshly-parsed
/// [`BookMetadata`].
///
/// # Errors
///
/// Returns [`DomainError::File`] when the book has no stored file path.
/// Returns [`DomainError::Parse`] when the file cannot be read.
pub async fn fetch_metadata(
    book_id: i32,
    book_repo: &Arc<dyn BookRepository>,
) -> Result<Option<BookMetadata>, crate::domain::error::DomainError> {
    let book = match book_repo.find_by_id(book_id).await? {
        Some(b) => b,
        None => return Ok(None),
    };

    let path = match book.file_path {
        Some(ref p) => p.clone(),
        None => {
            return Err(crate::domain::error::DomainError::File(
                "No file path".into(),
            ));
        }
    };

    let metadata = match book.file_type.as_deref() {
        Some("pdf") => {
            crate::infrastructure::file_handlers::pdf_handler::parse_pdf_meta(path)
                .await
                .map_err(|e| crate::domain::error::DomainError::Parse(e.to_string()))?
        }
        _ => {
            crate::infrastructure::file_handlers::epub_handler::parse_epub_meta(path)
                .await
                .map_err(|e| crate::domain::error::DomainError::Parse(e.to_string()))?
        }
    };

    Ok(Some(metadata))
}

/// Re-parses every book in the library and returns a list of their metadata.
///
/// Books whose files cannot be read are silently skipped.
///
/// # Arguments
///
/// * `book_repo` - Repository for listing all book records.
///
/// # Returns
///
/// A vector of [`BookMetadata`] for every book whose file could be re-parsed
/// successfully.
///
/// # Errors
///
/// Delegates to the repository; returns [`DomainError::Database`] on query
/// failures.
pub async fn list_metadata(
    book_repo: &Arc<dyn crate::domain::repository::BookRepository>,
) -> Result<Vec<BookMetadata>, crate::domain::error::DomainError> {
    let books = book_repo.find_all().await?;
    let mut all_metadata = Vec::new();

    for book in books {
        if let Some(ref path) = book.file_path {
            let meta_result = match book.file_type.as_deref() {
                Some("pdf") => {
                    crate::infrastructure::file_handlers::pdf_handler::parse_pdf_meta(path.clone())
                        .await
                }
                _ => {
                    crate::infrastructure::file_handlers::epub_handler::parse_epub_meta(path.clone())
                        .await
                }
            };
            if let Ok(meta) = meta_result {
                all_metadata.push(meta);
            }
        }
    }

    Ok(all_metadata)
}

/// Updates metadata fields for a book found by title search.
///
/// Only the provided (non-`None`) fields are updated. The book is located
/// by searching for the first title match.
///
/// # Arguments
///
/// * `book_name` - Substring to search book titles against.
/// * `title` - New title, or `None` to keep existing.
/// * `published_date` - New publication date, or `None` to keep existing.
/// * `isbn` - New ISBN, or `None` to keep existing.
/// * `book_repo` - Repository for searching and updating the book.
///
/// # Errors
///
/// Returns [`DomainError::NotFound`] when no book matches the title search.
pub async fn update_metadata(
    book_name: &str,
    title: Option<&str>,
    published_date: Option<&str>,
    isbn: Option<&str>,
    book_repo: &Arc<dyn BookRepository>,
) -> Result<(), crate::domain::error::DomainError> {
    let books = book_repo.search_by_title(book_name).await?;
    let book = books
        .into_iter()
        .next()
        .ok_or(crate::domain::error::DomainError::NotFound)?;

    book_repo
        .update(
            book.id,
            crate::domain::repository::UpdateBook {
                title: title.map(|s| s.to_string()),
                published_date: published_date.map(|s| s.to_string()),
                publisher_id: None,
                isbn: isbn.map(|s| s.to_string()),
                file_type: None,
                file_path: None,
                cover_image_path: None,
                checksum: None,
            },
        )
        .await
}
