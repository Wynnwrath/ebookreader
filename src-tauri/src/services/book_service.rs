use crate::data::models::books::NewBook;
use crate::data::repos::implementors::book_repo::BookRepo;
use crate::data::repos::traits::repository::Repository;
use crate::handlers::epub_handler::BookMetadata;
use diesel::result::Error;

/// Adds a new book to the database using the provided metadata.
/// Returns Ok(()) if successful, or an error if the book already exists (by checksum).
pub async fn add_book_from_metadata(
    metadata: &BookMetadata,
    publisher_id: Option<i32>,
) -> Result<(), Error> {
    let repo = BookRepo::new().await;

    // Check for duplicate by checksum
    if let Some(_existing) = repo.search_by_checksum(&metadata.checksum).await? {
        return Err(Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UniqueViolation,
            Box::new("Book with this checksum already exists".to_string()),
        ));
    }

    let new_book = NewBook {
        title: &metadata.title,
        published_date: metadata.published_date.as_deref(),
        publisher_id,
        isbn: metadata.isbn.as_deref(),
        file_type: Some("epub"),
        file_path: Some(&metadata.file_path),
        cover_image_path: None,
        checksum: Some(&metadata.checksum),
    };

    repo.add(new_book).await
}

/// Checks if a book with the given checksum already exists in the database.
pub async fn book_exists_by_checksum(checksum: &str) -> Result<bool, Error> {
    let repo = BookRepo::new().await;
    Ok(repo.search_by_checksum(checksum).await?.is_some())
}
