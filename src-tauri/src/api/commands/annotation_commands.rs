use crate::api::handlers;
use crate::application::state::AppState;
use tauri::State;

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn add_annotation(
    book_id: i32,
    start_position: String,
    end_position: String,
    chapter_title: Option<String>,
    highlighted_text: Option<String>,
    note: Option<String>,
    color: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    handlers::annotation_handler::add_annotation(
        book_id,
        start_position,
        end_position,
        chapter_title,
        highlighted_text,
        note,
        color,
        &state,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_annotations(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Vec<crate::domain::models::annotation::Annotation>, String> {
    handlers::annotation_handler::get_annotations(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_annotation(
    annotation_id: i32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    handlers::annotation_handler::delete_annotation(annotation_id, &state)
        .await
        .map_err(|e| e.to_string())
}
