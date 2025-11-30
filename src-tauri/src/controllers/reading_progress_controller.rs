use crate::{
    data::models::reading_progress::NewReadingProgress,
    data::repos::implementors::reading_progress_repo::ReadingProgressRepo,
    services::token_service::Tokenizer,
};
use axum::{
    extract::Query,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;

use super::dto::reading_progress_dto::{ReadingProgressDTO, UpdateProgressDTO};

#[derive(Deserialize)]
pub struct BookQueryParams {
    book_id: i32,
}
// TODO: Move to a TokenService helper module
async fn get_user_from_token(headers: &HeaderMap) -> Result<i32, StatusCode> {
    let token = headers
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let tokenizer = Tokenizer::get_instance().await;
    let claims = tokenizer
        .decode_token(token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    Ok(claims.sub)
}

pub async fn update_progress(
    headers: HeaderMap,
    Json(payload): Json<UpdateProgressDTO>,
) -> impl IntoResponse {
    let user_id = match get_user_from_token(&headers).await {
        Ok(id) => id,
        Err(status) => return (status, "Unauthorized").into_response(),
    };

    let repo = ReadingProgressRepo::new().await;
    let progress = NewReadingProgress {
        user_id,
        book_id: payload.book_id,
        current_position: &payload.current_position,
        chapter_title: payload.chapter_title.as_deref(),
        page_number: payload.page_number,
        progress_percentage: payload.progress_percentage,
    };

    match repo.upsert(progress).await {
        Ok(_) => (StatusCode::OK, "Progress updated").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn get_progress(
    headers: HeaderMap,
    Query(params): Query<BookQueryParams>,
) -> impl IntoResponse {
    let user_id = match get_user_from_token(&headers).await {
        Ok(id) => id,
        Err(status) => return (status, Json(None::<ReadingProgressDTO>)).into_response(),
    };

    let repo = ReadingProgressRepo::new().await;
    match repo.get_by_user_and_book(user_id, params.book_id).await {
        Ok(Some(progress)) => {
            let dto = ReadingProgressDTO {
                progress_id: progress.progress_id,
                user_id: progress.user_id,
                book_id: progress.book_id,
                current_position: progress.current_position,
                chapter_title: progress.chapter_title,
                page_number: progress.page_number,
                progress_percentage: progress.progress_percentage,
                last_read_at: progress.last_read_at,
            };
            (StatusCode::OK, Json(Some(dto))).into_response()
        }
        Ok(None) => (StatusCode::OK, Json(None::<ReadingProgressDTO>)).into_response(),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(None::<ReadingProgressDTO>),
        )
            .into_response(),
    }
}

pub async fn get_all_progress(headers: HeaderMap) -> impl IntoResponse {
    let user_id = match get_user_from_token(&headers).await {
        Ok(id) => id,
        Err(status) => return (status, Json(Vec::<ReadingProgressDTO>::new())).into_response(),
    };

    let repo = ReadingProgressRepo::new().await;
    match repo.get_by_user(user_id).await {
        Ok(Some(progress_list)) => {
            let dtos: Vec<ReadingProgressDTO> = progress_list
                .into_iter()
                .map(|p| ReadingProgressDTO {
                    progress_id: p.progress_id,
                    user_id: p.user_id,
                    book_id: p.book_id,
                    current_position: p.current_position,
                    chapter_title: p.chapter_title,
                    page_number: p.page_number,
                    progress_percentage: p.progress_percentage,
                    last_read_at: p.last_read_at,
                })
                .collect();
            (StatusCode::OK, Json(dtos)).into_response()
        }
        Ok(None) => (StatusCode::OK, Json(Vec::<ReadingProgressDTO>::new())).into_response(),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Vec::<ReadingProgressDTO>::new()),
        )
            .into_response(),
    }
}
