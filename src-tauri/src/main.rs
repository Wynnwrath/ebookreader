#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;

use diesel::Connection;
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};

pub const MIGRATIONS: EmbeddedMigrations =
    embed_migrations!("./src/infrastructure/database/migrations");

use stellaron_lib::application::state::AppState;
use stellaron_lib::infrastructure::database::database::create_pool;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let database_url =
        std::env::var("DATABASE_URL").unwrap_or_else(|_| "./database.db".to_string());

    let mut connection = diesel::SqliteConnection::establish(&database_url)
        .expect("Error establishing database connection");

    connection
        .run_pending_migrations(MIGRATIONS)
        .expect("Error running database migrations");

    let _pool = create_pool(&database_url);

    let app_state = AppState {
        book_repo: Arc::new(stellaron_lib::application::repository::book_repo::BookRepoImpl::new()),
        author_repo: Arc::new(stellaron_lib::application::repository::author_repo::AuthorRepoImpl::new()),
        publisher_repo: Arc::new(stellaron_lib::application::repository::publisher_repo::PublisherRepoImpl::new()),
        book_author_repo: Arc::new(stellaron_lib::application::repository::book_author_repo::BookAuthorRepoImpl::new()),
        bookmark_repo: Arc::new(stellaron_lib::application::repository::bookmark_repo::BookmarkRepoImpl::new()),
        annotation_repo: Arc::new(stellaron_lib::application::repository::annotation_repo::AnnotationRepoImpl::new()),
        reading_progress_repo: Arc::new(stellaron_lib::application::repository::reading_progress_repo::ReadingProgressRepoImpl::new()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            stellaron_lib::api::commands::book_commands::import_book,
            stellaron_lib::api::commands::book_commands::read_epub,
            stellaron_lib::api::commands::book_commands::list_books,
            stellaron_lib::api::commands::book_commands::get_book_details,
            stellaron_lib::api::commands::book_commands::get_cover_img,
            stellaron_lib::api::commands::book_commands::remove_book,
            stellaron_lib::api::commands::bookmark_commands::add_bookmark,
            stellaron_lib::api::commands::bookmark_commands::get_bookmarks,
            stellaron_lib::api::commands::bookmark_commands::delete_bookmark,
            stellaron_lib::api::commands::annotation_commands::add_annotation,
            stellaron_lib::api::commands::annotation_commands::get_annotations,
            stellaron_lib::api::commands::annotation_commands::delete_annotation,
            stellaron_lib::api::commands::library_commands::scan_books_directory,
            stellaron_lib::api::commands::reading_progress_commands::update_reading_progress,
            stellaron_lib::api::commands::reading_progress_commands::get_reading_progress,
            stellaron_lib::api::commands::metadata_commands::fetch_metadata,
            stellaron_lib::api::commands::metadata_commands::list_metadata,
            stellaron_lib::api::commands::metadata_commands::update_metadata,
            exit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}
