//! Tauri `#[tauri::command]` functions exposed to the frontend.
//!
//! Each command delegates to a corresponding handler, which in turn calls
//! application-layer use cases. Commands return `Result<T, String>` for
//! serialization over IPC.

pub mod annotation_commands;
pub mod book_commands;
pub mod bookmark_commands;
pub mod library_commands;
pub mod metadata_commands;
pub mod reading_progress_commands;
