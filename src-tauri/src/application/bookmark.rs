use std::sync::Arc;

use crate::domain::error::DomainError;
use crate::domain::models::bookmark::Bookmark;
use crate::domain::repository::*;

pub async fn add_bookmark(
    bookmark: NewBookmark,
    bookmark_repo: &Arc<dyn BookmarkRepository>,
) -> Result<(), DomainError> {
    bookmark_repo.insert(bookmark).await
}

pub async fn get_bookmarks(
    book_id: i32,
    bookmark_repo: &Arc<dyn BookmarkRepository>,
) -> Result<Vec<Bookmark>, DomainError> {
    bookmark_repo.find_by_book(book_id).await
}

pub async fn delete_bookmark(
    id: i32,
    bookmark_repo: &Arc<dyn BookmarkRepository>,
) -> Result<(), DomainError> {
    bookmark_repo.delete(id).await
}
