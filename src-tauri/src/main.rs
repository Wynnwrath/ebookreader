// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use stellaron_lib::commands::{auth_command, book_commands, library_commands, metadata_commands};

#[tokio::main]
async fn main() {
    run();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Book Commands
            book_commands::import_book,
            book_commands::read_epub,
            book_commands::list_books,
            book_commands::get_book_details,
            book_commands::add_bookmark,
            book_commands::get_bookmarks,
            book_commands::delete_bookmark,
            book_commands::add_annotation,
            book_commands::get_annotations,
            book_commands::delete_annotation,
            // Library Commands
            library_commands::add_book_to_user_library,
            library_commands::list_user_library_books,
            library_commands::remove_book_from_user_library,
            // Metadata Commands
            metadata_commands::fetch_metadata,
            metadata_commands::list_metadata,
            metadata_commands::update_metadata,
            // Auth Commands
            auth_command::login,
            auth_command::register,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
