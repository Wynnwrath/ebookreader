# Stellaron Backend Documentation

Backend for **Stellaron**, a Tauri v2 desktop ebook reader supporting EPUB, PDF, and (planned) MOBI formats.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Layer Descriptions](#layer-descriptions)
- [Database Schema](#database-schema)
- [Tauri IPC Commands](#tauri-ipc-commands)
- [File Handlers](#file-handlers)
- [Error Handling](#error-handling)
- [Development Guide](#development-guide)

---

## Architecture Overview

The backend follows a **layered architecture** (Domain / Application / Infrastructure / API) inspired by clean architecture principles:

```
Frontend (React)
    │
    │ Tauri IPC invoke()
    ▼
API Layer (api/commands/)     #[tauri::command]
    │
    ▼
API Handlers (api/handlers/)  constructs input structs
    │
    ▼
Application Layer             use-case functions
    │
    ├──► Domain Layer         pure models, traits, errors
    │
    └──► Infrastructure Layer DB pool, file parsers
```

**Key principles:**
- **Domain layer** has zero framework dependencies — pure Rust structs and async traits.
- **Application layer** orchestrates domain models and repository calls as plain async functions.
- **Infrastructure layer** implements persistence (Diesel async + SQLite) and file parsing (EPUB, PDF).
- **API layer** is a thin Tauri IPC bridge that maps commands to handlers to use cases.

---

## Directory Structure

```
src-tauri/
├── build.rs                          # Tauri build script
├── Cargo.toml                        # Rust dependencies
├── diesel.toml                       # Diesel CLI config
├── tauri.conf.json                   # Tauri app configuration
├── .env                              # DATABASE_URL=sqlite://./dev.db
├── src/
│   ├── main.rs                       # Entry point: DB init, migrations, Tauri launch
│   ├── lib.rs                        # Crate root (stellaron_lib)
│   │
│   ├── domain/                       # Inner layer — zero framework deps
│   │   ├── error.rs                  # DomainError enum
│   │   ├── repository.rs             # Repository traits + input structs
│   │   ├── models/                   # Domain entities
│   │   │   ├── book.rs               # Book
│   │   │   ├── author.rs             # Author
│   │   │   ├── publisher.rs          # Publisher
│   │   │   ├── bookmark.rs           # Bookmark
│   │   │   ├── annotation.rs         # Annotation
│   │   │   └── reading_progress.rs   # ReadingProgress
│   │   └── dto/
│   │       └── book_dto.rs           # BookDto (presentation)
│   │
│   ├── application/                  # Use cases + repo implementations
│   │   ├── state.rs                  # AppState (DI container)
│   │   ├── book.rs                   # Book use cases
│   │   ├── bookmark.rs               # Bookmark use cases
│   │   ├── annotation.rs             # Annotation use cases
│   │   ├── reading_progress.rs       # Reading progress use cases
│   │   ├── repository/               # Diesel-backed repo impls
│   │   │   ├── book_repo.rs
│   │   │   ├── author_repo.rs
│   │   │   ├── publisher_repo.rs
│   │   │   ├── book_author_repo.rs
│   │   │   ├── bookmark_repo.rs
│   │   │   ├── annotation_repo.rs
│   │   │   └── reading_progress_repo.rs
│   │   └── service/
│   │       └── book_service.rs       # Metadata service
│   │
│   ├── infrastructure/               # DB, file handlers
│   │   ├── database/
│   │   │   ├── database.rs           # Connection pool (deadpool + Diesel async)
│   │   │   ├── models/               # Diesel ORM rows + schema
│   │   │   │   ├── schema.rs         # Auto-generated table definitions
│   │   │   │   ├── book.rs
│   │   │   │   ├── author.rs
│   │   │   │   ├── publisher.rs
│   │   │   │   ├── book_author.rs
│   │   │   │   ├── bookmark.rs
│   │   │   │   ├── annotation.rs
│   │   │   │   └── reading_progress.rs
│   │   │   └── migrations/
│   │   │       └── 0001_initial_schema/
│   │   └── file_handlers/
│   │       ├── mod.rs                # BookMetadata struct
│   │       ├── epub_handler.rs       # EPUB parsing (rbook)
│   │       ├── pdf_handler.rs        # PDF parsing (pdf_oxide)
│   │       └── mobi_handler.rs       # Placeholder
│   │
│   ├── api/                          # Tauri IPC layer
│   │   ├── commands/
│   │   │   ├── book_commands.rs
│   │   │   ├── bookmark_commands.rs
│   │   │   ├── annotation_commands.rs
│   │   │   ├── library_commands.rs
│   │   │   ├── reading_progress_commands.rs
│   │   │   └── metadata_commands.rs
│   │   └── handlers/
│   │       ├── book_handler.rs
│   │       ├── bookmark_handler.rs
│   │       ├── annotation_handler.rs
│   │       ├── library_handler.rs
│   │       ├── reading_progress_handler.rs
│   │       └── metadata_handler.rs
│   │
│   └── utils/
│       ├── file.rs                   # SHA-256 checksum
│       ├── serializers.rs            # NaiveDateTime serde
│       └── deserializers.rs          # NaiveDateTime serde
│
└── tests/
    ├── epub_handler_tests.rs
    ├── pdf_handler_tests.rs
    └── image_processing_test.rs
```

---

## Layer Descriptions

### Domain Layer (`domain/`)

The innermost layer with **no external framework dependencies**. Contains:

- **`DomainError`** — Error enum covering all business failure modes (`BookNotFound`, `DuplicateBook`, `Database`, `File`, `Parse`, `NotFound`). Automatically converts from Diesel errors.
- **Repository traits** — Async trait definitions for each entity (`BookRepository`, `AuthorRepository`, `PublisherRepository`, `BookAuthorRepository`, `BookmarkRepository`, `AnnotationRepository`, `ReadingProgressRepository`). All traits require `Send + Sync`.
- **Domain models** — Plain Rust structs (`Book`, `Author`, `Publisher`, `Bookmark`, `Annotation`, `ReadingProgress`) with no ORM annotations.
- **DTOs** — `BookDto` combines a `Book` with resolved author/publisher names for frontend rendering.

### Application Layer (`application/`)

Orchestrates business logic as **plain async functions** (no framework coupling):

| Module | Purpose |
|--------|---------|
| `state.rs` | `AppState` — DI container holding `Arc<dyn Repository>` for all 7 repos |
| `book.rs` | Import, list, read, get cover, remove, scan directory |
| `bookmark.rs` | Add, list, delete bookmarks |
| `annotation.rs` | Add, list, delete annotations |
| `reading_progress.rs` | Get, upsert reading progress |
| `service/book_service.rs` | Fetch, list, update book metadata |

**Repository implementations** (`application/repository/`) use Diesel async with deadpool. All write operations acquire `lock_db()` to prevent SQLite "database is locked" errors, then execute within `conn.transaction()`.

### Infrastructure Layer (`infrastructure/`)

- **`database.rs`** — Global `DB_POOL` (deadpool), `DB_LOCK` (async mutex for writes), SQLite pragma setup (WAL mode, foreign keys, mmap).
- **`models/`** — Diesel ORM row types with `From` impls converting to/from domain models. `schema.rs` is auto-generated by Diesel CLI.
- **`file_handlers/`** — EPUB parsing via `rbook`, PDF parsing via `pdf_oxide`. All file I/O runs on `spawn_blocking` to avoid blocking the Tokio runtime.

### API Layer (`api/`)

- **Commands** (`api/commands/`) — `#[tauri::command]` functions exposed to the frontend. Accept `State<'_, AppState>`, return `Result<T, String>`.
- **Handlers** (`api/handlers/`) — Thin delegation layer that constructs domain input structs and calls application use cases.

---

## Database Schema

SQLite with Diesel async. 7 tables:

```
books ──────────────┬─────────── book_authors ──────── authors
    │                                       
    ├─── bookmarks
    ├─── annotations
    ├─── reading_progress
    │
    └─── publishers (via publisher_id FK)
```

**Key tables:**

| Table | Primary Key | Notable Columns |
|-------|-------------|-----------------|
| `books` | `book_id` | `title`, `file_type`, `file_path`, `checksum` (SHA-256), `added_at` |
| `authors` | `author_id` | `name` |
| `publishers` | `publisher_id` | `name` |
| `book_authors` | `(book_id, author_id)` | Many-to-many join |
| `bookmarks` | `bookmark_id` | `book_id`, `position`, `chapter_title`, `page_number` |
| `annotations` | `annotation_id` | `book_id`, `start_position`, `end_position`, `highlighted_text`, `note`, `color` |
| `reading_progress` | `progress_id` | `book_id`, `current_position`, `progress_percentage`, `last_read_at` |

**SQLite pragmas set on startup:**
- `foreign_keys = ON`
- `journal_mode = WAL`
- `synchronous = NORMAL`
- `mmap_size = 30000000000`

---

## Tauri IPC Commands

### Book Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `import_book` | `path: String` | `BookDto` | Imports an ebook file into the library |
| `read_epub` | `path: String` | `String` (HTML) | Reads full EPUB content |
| `read_book` | `path: String, file_type: String` | `BookContent` | Reads content by file type |
| `get_pdf_page_count` | `path: String` | `u32` | Returns PDF page count |
| `read_pdf_page` | `path: String, page_number: u32` | `PdfPage` | Renders a PDF page |
| `list_books` | — | `Vec<BookDto>` | Lists all books |
| `get_book_details` | `book_id: i32` | `Option<BookDto>` | Gets book details by ID |
| `get_cover_img` | `book_id: i32` | `Option<Vec<u8>>` | Gets cover image bytes |
| `remove_book` | `book_id: i32` | `()` | Removes a book |

### Bookmark Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `add_bookmark` | `book_id, position, chapter_title?, page_number?` | `()` | Creates a bookmark |
| `get_bookmarks` | `book_id: i32` | `Vec<Bookmark>` | Lists bookmarks for a book |
| `delete_bookmark` | `bookmark_id: i32` | `()` | Deletes a bookmark |

### Annotation Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `add_annotation` | `book_id, start_position, end_position, chapter_title?, highlighted_text?, note?, color?` | `()` | Creates an annotation |
| `get_annotations` | `book_id: i32` | `Vec<Annotation>` | Lists annotations for a book |
| `delete_annotation` | `annotation_id: i32` | `()` | Deletes an annotation |

### Library Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `scan_books_directory` | `directory_path: String` | `Vec<String>` (errors) | Recursively imports ebooks from a directory |

### Reading Progress Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `update_reading_progress` | `book_id, current_position, chapter_title?, page_number?, progress_percentage?` | `()` | Upserts reading progress |
| `get_reading_progress` | `book_id: i32` | `Option<ReadingProgress>` | Gets reading progress |

### Metadata Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `fetch_metadata` | `book_id: i32` | `Option<BookMetadata>` | Re-parses file for fresh metadata |
| `list_metadata` | — | `Vec<BookMetadata>` | Re-parses all books for metadata |
| `update_metadata` | `book_name, title?, published_date?, isbn?` | `()` | Updates metadata fields by title search |

### System Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `exit_app` | — | — | Exits the application |

---

## File Handlers

### EPUB (`epub_handler.rs`)

Uses the `rbook` crate for parsing. Key operations:

- **`scan_epubs(dir)`** — Recursively finds `.epub` files (blocking thread).
- **`parse_epub_meta(path)`** — Extracts title, authors, publishers, date, ISBN, cover image. Computes SHA-256 checksum.
- **`get_epub_content(path)`** — Concatenates spine item HTML with inline base64 images. Resolves relative image paths via `resolve_path()`.
- **`get_cover_image_by_book_id(book_id)`** — Looks up book in DB, extracts cover from EPUB manifest.

### PDF (`pdf_handler.rs`)

Uses `pdf_oxide` for parsing and rendering. Key operations:

- **`scan_pdfs(dir)`** — Recursively finds `.pdf` files (blocking thread).
- **`parse_pdf_meta(path)`** — Extracts XMP metadata (title, creator, date). Falls back to defaults.
- **`get_pdf_cover(path)`** — Renders first page at 150 DPI.
- **`get_pdf_page_count(path)`** — Returns page count.
- **`read_pdf_page(path, page_number)`** — Renders page as base64 PNG with extracted text spans and bounding boxes.

### MOBI (`mobi_handler.rs`)

Placeholder — not yet implemented.

---

## Error Handling

All errors flow through `DomainError`:

```rust
pub enum DomainError {
    BookNotFound(i32),     // Book lookup failed
    DuplicateBook(String), // Checksum collision during import
    Database(String),      // Diesel / pool errors (auto-converted)
    File(String),          // File I/O errors
    Parse(String),         // Ebook parsing failures
    NotFound,              // Generic not-found
}
```

At the API boundary, `DomainError` is converted to `String` via `e.to_string()` for Tauri IPC serialization.

---

## Development Guide

### Database & Migrations

```bash
# Run migrations
diesel migration run

# Redo last migration
diesel migration redo

# Generate new migration
diesel migration generate <name>
```

**After any schema change**, commit `infrastructure/database/models/schema.rs`.

### Testing

SQLite does not support concurrent writes. All DB tests must be serial:

```bash
cargo test -- --test-threads=1
```

Use `#[serial_test::serial]` on every test function that touches the database.

### Key Conventions

1. **Always acquire connections from the pool** — never store connections in structs.
2. **Write operations require `lock_db()`** — prevents "database is locked" errors.
3. **All file I/O uses `spawn_blocking`** — avoids blocking the Tokio runtime.
4. **DTOs are constructed in the application layer** from domain entities.
5. **Repository traits are defined in `domain/repository.rs`** — implementations are in `application/repository/`.

### Dependencies

| Crate | Purpose |
|-------|---------|
| `tauri` 2 | Desktop framework |
| `diesel-async` + `deadpool` | Async SQLite ORM |
| `rbook` | EPUB parsing |
| `pdf_oxide` | PDF parsing + rendering |
| `tokio` | Async runtime |
| `thiserror` | Error derive macro |
| `scraper` | HTML parsing (EPUB image embedding) |
| `sha2` | SHA-256 checksums |
