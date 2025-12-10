use crate::data::models::annotations::NewAnnotation;
use crate::data::models::bookmarks::NewBookmark;
use crate::data::models::books::NewBook;
use crate::data::repos::implementors::annotation_repo::AnnotationRepo;
use crate::data::repos::implementors::book_repo::BookRepo;
use crate::data::repos::implementors::bookmark_repo::BookmarkRepo;
use crate::data::repos::traits::repository::Repository;
pub(crate) use crate::handlers::epub_handler::{get_epub_content, scan_epubs, BookMetadata};
use diesel::result::Error;
use std::path::Path;

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

/// Extracts and returns HTML content from an ebook file.
/// Retrieves the book's file path from the database and extracts HTML content.
pub async fn extract_book_html_content(
    book_id: i32,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let repo = BookRepo::new().await;

    let book = repo
        .get_by_id(book_id)
        .await?
        .ok_or_else(|| format!("Book with id {} not found", book_id))?;

    let file_path = book
        .file_path
        .ok_or_else(|| format!("Book with id {} has no file path", book_id))?;

    get_epub_content(&file_path).await
}

/// Adds a bookmark to a book for a specific user.
pub async fn add_bookmark(
    user_id: i32,
    book_id: i32,
    position: &str,
    chapter_title: Option<&str>,
    page_number: Option<i32>,
) -> Result<(), Error> {
    let repo = BookmarkRepo::new().await;

    let new_bookmark = NewBookmark {
        user_id,
        book_id,
        chapter_title,
        page_number,
        position,
    };

    repo.add(new_bookmark).await
}

/// Retrieves all bookmarks for a specific user and book.
pub async fn get_bookmarks(
    user_id: i32,
    book_id: i32,
) -> Result<Option<Vec<crate::data::models::bookmarks::Bookmarks>>, Error> {
    let repo = BookmarkRepo::new().await;
    repo.get_by_user_and_book(user_id, book_id).await
}

/// Deletes a bookmark by its ID.
pub async fn delete_bookmark(bookmark_id: i32) -> Result<(), Error> {
    let repo = BookmarkRepo::new().await;
    repo.delete(bookmark_id).await
}

/// Adds an annotation to a book for a specific user.
pub async fn add_annotation(
    user_id: i32,
    book_id: i32,
    start_position: &str,
    end_position: &str,
    chapter_title: Option<&str>,
    highlighted_text: Option<&str>,
    note: Option<&str>,
    color: Option<&str>,
) -> Result<(), Error> {
    let repo = AnnotationRepo::new().await;

    let new_annotation = NewAnnotation {
        user_id,
        book_id,
        chapter_title,
        start_position,
        end_position,
        highlighted_text,
        note,
        color,
    };

    repo.add(new_annotation).await
}

/// Retrieves all annotations for a specific user and book.
pub async fn get_annotations(
    user_id: i32,
    book_id: i32,
) -> Result<Option<Vec<crate::data::models::annotations::Annotations>>, Error> {
    let repo = AnnotationRepo::new().await;
    repo.get_by_user_and_book(user_id, book_id).await
}

/// Deletes an annotation by its ID.
pub async fn delete_annotation(annotation_id: i32) -> Result<(), Error> {
    let repo = AnnotationRepo::new().await;
    repo.delete(annotation_id).await
}

/// Updates an existing annotation.
pub async fn update_annotation(
    annotation_id: i32,
    chapter_title: Option<&str>,
    start_position: Option<&str>,
    end_position: Option<&str>,
    highlighted_text: Option<&str>,
    note: Option<&str>,
    color: Option<&str>,
) -> Result<(), Error> {
    let repo = AnnotationRepo::new().await;

    let update = crate::data::models::annotations::UpdateAnnotation {
        chapter_title,
        start_position,
        end_position,
        highlighted_text,
        note,
        color,
        updated_at: None,
    };

    repo.update(annotation_id, update).await
}
//TODO: Add add_book_from_file function to handle adding books directly from file paths
// TODO: Test this function should add all epub files from a directory to local database
pub async fn add_books_from_dir<P: AsRef<Path> + Send + 'static>(path: P) {
    let epubs = scan_epubs(path).await.unwrap();

    for path in epubs {
        add_book_from_file(path).await.unwrap();
    }
}

pub async fn add_book_from_file<P: AsRef<Path> + Send + 'static>(path: P) -> Result<(), Error> {
    let metadata =
        crate::handlers::epub_handler::parse_epub_meta(path.as_ref().to_string_lossy().to_string())
            .await
            .unwrap();
    add_book_from_metadata(&metadata, None).await
}
