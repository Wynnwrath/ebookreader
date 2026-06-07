# API Layer

The API layer is the Tauri IPC bridge between the React frontend and the Rust backend.

## Module Overview

```
api/
├── commands/                     # #[tauri::command] functions
│   ├── book_commands.rs
│   ├── bookmark_commands.rs
│   ├── annotation_commands.rs
│   ├── library_commands.rs
│   ├── reading_progress_commands.rs
│   └── metadata_commands.rs
└── handlers/                     # Thin delegation layer
    ├── book_handler.rs
    ├── bookmark_handler.rs
    ├── annotation_handler.rs
    ├── library_handler.rs
    ├── reading_progress_handler.rs
    └── metadata_handler.rs
```

## Design

The API layer follows a **two-tier delegation** pattern:

1. **Commands** (`#[tauri::command]`) — Accept raw parameters from the frontend, extract `State<'_, AppState>`, and delegate to handlers. Return `Result<T, String>` for IPC serialization.

2. **Handlers** — Construct domain input structs (e.g., `NewBookmark`) from raw parameters and call application-layer use-case functions. Return `Result<T, DomainError>`.

This separation keeps commands focused on Tauri-specific concerns (state extraction, error mapping) while handlers contain the thin wiring logic.

## Data Flow Example

```
Frontend: invoke("add_bookmark", { book_id: 1, position: "..." })
    │
    ▼
bookmark_commands::add_bookmark(book_id, position, chapter_title, page_number, state)
    │  extracts State<AppState>
    ▼
bookmark_handler::add_bookmark(book_id, position, chapter_title, page_number, &state)
    │  constructs NewBookmark { book_id, position, ... }
    ▼
application::bookmark::add_bookmark(NewBookmark, &state.bookmark_repo)
    │  calls bookmark_repo.insert(bookmark)
    ▼
BookmarkRepoImpl::insert(bookmark)
    │  lock_db() → connect_from_pool() → transaction
    ▼
SQLite INSERT into bookmarks table
```

## Error Mapping

All commands map `DomainError` to `String` at the boundary:

```rust
.map_err(|e| e.to_string())
```

This means error messages are human-readable strings sent to the frontend. The frontend should match on error message content or use structured error types if needed in the future.

## Registered Commands

All 20 commands are registered in `main.rs` via `generate_handler![]`:

```rust
tauri::generate_handler![
    // Book commands (9)
    import_book, read_epub, read_book, get_pdf_page_count,
    read_pdf_page, list_books, get_book_details, get_cover_img, remove_book,
    // Bookmark commands (3)
    add_bookmark, get_bookmarks, delete_bookmark,
    // Annotation commands (3)
    add_annotation, get_annotations, delete_annotation,
    // Library commands (1)
    scan_books_directory,
    // Reading progress commands (2)
    update_reading_progress, get_reading_progress,
    // Metadata commands (3)
    fetch_metadata, list_metadata, update_metadata,
    // System commands (1)
    exit_app,
]
```

## State Management

Commands that need database access accept `state: State<'_, AppState>`. Tauri manages the state's lifetime and makes it available to all registered commands.

Commands that don't need state (e.g., `read_epub`, `read_book`, `get_pdf_page_count`) accept only file paths.

## BookContent Enum

The `read_book` command returns a tagged enum:

```rust
#[derive(Serialize)]
#[serde(tag = "type", content = "data")]
pub enum BookContent {
    Epub(String),       // Raw HTML
    Pdf(PdfPage),       // Rendered page with text spans
}
```

The `#[serde(tag = "type", content = "data")]` attribute produces JSON like:

```json
{ "type": "Epub", "data": "<html>..." }
{ "type": "Pdf", "data": { "page_number": 0, "image_data": "...", ... } }
```
