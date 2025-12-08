use std::path::Path;

// Put command implementations related to book management to be used on the tauri frontend here
#[tauri::command]
pub async fn import_book<P: AsRef<Path> + Send + Sync + 'static>(
    path: P
) -> Result<(), String> {
    unimplemented!()
}
