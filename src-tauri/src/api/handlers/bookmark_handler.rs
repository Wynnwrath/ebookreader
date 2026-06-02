use crate::application::state::AppState;
use crate::domain::error::DomainError;
use crate::domain::models::bookmark::Bookmark;
use crate::domain::repository::*;

pub async fn add_bookmark(
    book_id: i32,
    position: String,
    chapter_title: Option<String>,
    page_number: Option<i32>,
    state: &AppState,
) -> Result<(), DomainError> {
    crate::application::manage_bookmarks::add_bookmark(
        NewBookmark {
            book_id,
            chapter_title,
            page_number,
            position,
        },
        &state.bookmark_repo,
    )
    .await
}

pub async fn get_bookmarks(book_id: i32, state: &AppState) -> Result<Vec<Bookmark>, DomainError> {
    crate::application::manage_bookmarks::get_bookmarks(book_id, &state.bookmark_repo).await
}

pub async fn delete_bookmark(id: i32, state: &AppState) -> Result<(), DomainError> {
    crate::application::manage_bookmarks::delete_bookmark(id, &state.bookmark_repo).await
}
