// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use stellaron_lib::commands::book_commands;
#[tokio::main]
async fn main() {
    stellaron_lib::api::start();

    run();
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![book_commands::import_book, book_commands::read_epub])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
