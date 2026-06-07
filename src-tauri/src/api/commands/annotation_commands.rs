use crate::api::handlers;
use crate::application::state::AppState;
use tauri::State;

/// Creates a new annotation (highlight with optional note) for a book.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
/// * `start_position` - Start of the highlighted text range.
/// * `end_position` - End of the highlighted text range.
/// * `chapter_title` - Optional chapter title.
/// * `highlighted_text` - Optional captured highlight text.
/// * `note` - Optional user-written note.
/// * `color` - Optional highlight color identifier.
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

/// Returns all annotations for the given book.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
#[tauri::command]
pub async fn get_annotations(
    book_id: i32,
    state: State<'_, AppState>,
) -> Result<Vec<crate::domain::models::annotation::Annotation>, String> {
    handlers::annotation_handler::get_annotations(book_id, &state)
        .await
        .map_err(|e| e.to_string())
}

/// Deletes an annotation by ID.
///
/// # Arguments
///
/// * `annotation_id` - The annotation's database ID.
#[tauri::command]
pub async fn delete_annotation(
    annotation_id: i32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    handlers::annotation_handler::delete_annotation(annotation_id, &state)
        .await
        .map_err(|e| e.to_string())
}
