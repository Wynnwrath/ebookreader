use crate::application::state::AppState;
use crate::domain::error::DomainError;
use crate::domain::models::annotation::Annotation;
use crate::domain::repository::*;

#[allow(clippy::too_many_arguments)]
pub async fn add_annotation(
    book_id: i32,
    start_position: String,
    end_position: String,
    chapter_title: Option<String>,
    highlighted_text: Option<String>,
    note: Option<String>,
    color: Option<String>,
    state: &AppState,
) -> Result<(), DomainError> {
    crate::application::annotation::add_annotation(
        NewAnnotation {
            book_id,
            chapter_title,
            start_position,
            end_position,
            highlighted_text,
            note,
            color,
        },
        &state.annotation_repo,
    )
    .await
}

pub async fn get_annotations(
    book_id: i32,
    state: &AppState,
) -> Result<Vec<Annotation>, DomainError> {
    crate::application::annotation::get_annotations(book_id, &state.annotation_repo).await
}

pub async fn delete_annotation(id: i32, state: &AppState) -> Result<(), DomainError> {
    crate::application::annotation::delete_annotation(id, &state.annotation_repo).await
}
