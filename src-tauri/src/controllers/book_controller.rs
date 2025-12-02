use crate::{
    controllers::auth_middleware::AuthUser,
    data::repos::{implementors::book_repo::BookRepo, traits::repository::Repository},
    handlers::epub_handler,
};
use axum::{
    extract::Path,
    http::StatusCode,
    response::{IntoResponse, Json},
};

pub async fn get_book_content(_user: AuthUser, Path(book_id): Path<i32>) -> impl IntoResponse {
    let book_repo = BookRepo::new().await;

    match book_repo.get_by_id(book_id).await {
        Ok(Some(book)) => {
            if let Some(file_path) = book.file_path {
                match epub_handler::get_epub_content(&file_path).await {
                    Ok(content) => (StatusCode::OK, Json(content)).into_response(),
                    Err(e) => {
                        eprintln!("Failed to get epub content: {}", e);
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            "Failed to get book content",
                        )
                            .into_response()
                    }
                }
            } else {
                (StatusCode::NOT_FOUND, "Book file path not found").into_response()
            }
        }
        Ok(None) => (StatusCode::NOT_FOUND, "Book not found").into_response(),
        Err(e) => {
            eprintln!("Failed to get book: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to get book").into_response()
        }
    }
}

// TODO: 
