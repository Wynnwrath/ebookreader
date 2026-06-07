use std::sync::Arc;

use crate::domain::error::DomainError;
use crate::domain::models::bookmark::Bookmark;
use crate::domain::repository::*;

/// Creates a new bookmark for a book.
///
/// # Arguments
///
/// * `bookmark` - The bookmark data (book ID, position, optional chapter/page).
/// * `bookmark_repo` - Repository for inserting the bookmark.
///
/// # Errors
///
/// Delegates to the repository; returns [`DomainError::Database`] on failure.
pub async fn add_bookmark(
    bookmark: NewBookmark,
    bookmark_repo: &Arc<dyn BookmarkRepository>,
) -> Result<(), DomainError> {
    bookmark_repo.insert(bookmark).await
}

/// Returns all bookmarks for the given book.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
/// * `bookmark_repo` - Repository for querying bookmarks.
///
/// # Returns
///
/// A vector of [`Bookmark`] entities belonging to the book.
///
/// # Errors
///
/// Delegates to the repository; returns [`DomainError::Database`] on failure.
pub async fn get_bookmarks(
    book_id: i32,
    bookmark_repo: &Arc<dyn BookmarkRepository>,
) -> Result<Vec<Bookmark>, DomainError> {
    bookmark_repo.find_by_book(book_id).await
}

/// Deletes a bookmark by ID.
///
/// # Arguments
///
/// * `id` - The bookmark's database ID.
/// * `bookmark_repo` - Repository for deleting the bookmark.
///
/// # Errors
///
/// Delegates to the repository; returns [`DomainError::Database`] on failure.
/// No error is returned if the ID does not exist.
pub async fn delete_bookmark(
    id: i32,
    bookmark_repo: &Arc<dyn BookmarkRepository>,
) -> Result<(), DomainError> {
    bookmark_repo.delete(id).await
}
