# Stellaron - Ebook Reader Project (Backend)

## Architecture Overview

**Tauri v2** desktop app for reading ebooks locally. Single-user, no authentication.

### Layer Architecture
```
[Frontend (React)] → [API (Tauri IPC)] → [Application (Use Cases)] → [Domain (Models/Traits)]
                                              ↓
                                         [Infrastructure (DB, Handlers)]
```

Architecture follows [sheroz/axum-rest-api-sample](https://github.com/sheroz/axum-rest-api-sample) pattern.

## Project Structure

```
src/
├── main.rs                        # Entry: DB init, migrations, Tauri launch
├── lib.rs                         # Crate root (stellaron_lib)
│
├── domain/                        # Inner layer — zero framework deps
│   ├── models/                    # Domain entities (book.rs, author.rs, etc.)
│   ├── dto/                       # DTOs for presentation (book_dto.rs)
│   ├── repository.rs              # Unified CRUD trait definitions
│   └── error.rs                   # DomainError enum
│
├── application/                   # Use cases + repo implementations
│   ├── *.rs                       # Flat use case files (import_book.rs, list_books.rs, etc.)
│   ├── state.rs                   # AppState struct (wired dependencies)
│   ├── repository/                # Diesel-backed repo implementations (book_repo.rs, etc.)
│   └── service/                   # Application services (book_service.rs, epub_service.rs)
│
├── infrastructure/                # DB, file handlers
│   ├── database/
│   │   ├── database.rs            # Connection pool (deadpool + Diesel async)
│   │   ├── models/                # Diesel ORM models + schema.rs
│   │   └── migrations/            # SQL migrations
│   └── file_handlers/             # EPUB, PDF, MOBI parsers
│
├── api/                           # Tauri IPC commands (presentation)
│   ├── commands/                  # Tauri #[tauri::command] handlers
│   └── error.rs                   # API error mapping
│
└── utils/                         # Serialization helpers
```

## Critical Developer Workflows

### Database & Migrations
- **Setup:** `set -x DATABASE_URL sqlite://stellaron.db` (Fish) or `.env`.
- **Migrations:** `diesel migration generate <name>`, `diesel migration run`, `diesel migration redo`.
- **Rule:** Always commit `infrastructure/database/models/schema.rs` after migrations.
- **Fresh start:** On startup, old `database.db` is deleted automatically — schema is incompatible with pre-refactor versions.

### Testing (CRITICAL)
SQLite does not support concurrent writes. **All DB tests must be serial.**
```bash
cargo test -- --test-threads=1
```
- Use `#[serial_test::serial]` on every test function touching the DB.
- Import crate as `stellaron_lib` in `tests/`.

## Code Patterns & Conventions

### 1. Database Access (Diesel Async)
**Always** acquire connections from the pool. **Never** store connections in structs.
**Write Operations:** Must use `lock_db()` to prevent "database is locked" errors.

```rust
use crate::infrastructure::database::database::{connect_from_pool, lock_db};
let mut conn = connect_from_pool().await?;
let db_lock = lock_db();
let _guard = db_lock.lock().await; // Critical for SQLite writes
```

### 2. Repository Pattern
- **Traits:** Defined in `domain/repository.rs` (single file, all entity traits).
- **Implementations:** `application/repository/*.rs` (Diesel-backed, one file per entity).
- Repo impls implement domain traits via `#[async_trait]`.
- **Return Type:** `Result<Vec<T>, DomainError>` or `Result<Option<T>, DomainError>` (not Ok(None) = Not Found).

### 3. Use Case Pattern
Each use case is a plain async function in `application/*.rs`. It takes `Arc<dyn RepositoryTrait>` references plus domain inputs, orchestrates the workflow, and returns a DTO.

```rust
pub async fn import_book(
    file_path: &Path,
    book_repo: &Arc<dyn BookRepository>,
    author_repo: &Arc<dyn AuthorRepository>,
    epub_handler: &EpubHandler,
) -> Result<BookDto, DomainError> { ... }
```

### 4. Dependency Injection
All dependencies wired in `main.rs` via `application::state::AppState`, passed to Tauri commands as `State<'_, AppState>`.

## Data Flow

1. Frontend (React) sends Tauri IPC invoke to a command in `api/commands/`
2. Command extracts `AppState`, calls application use case in `application/*.rs`
3. Use case orchestrates domain models + repository calls
4. Repository impl (`application/repository/*.rs`) queries DB via Diesel
5. If a file path is involved, the use case calls `infrastructure/file_handlers/` to parse ebook content
6. Result (DTO from `domain/dto/`) flows back to the Tauri command and to the frontend

## Implementation Status (Jun 2026)
- **Auth:** Removed. Single-user, no login required.
- **Database:** Schema refactored — no users, no user_library. Bookmarks/annotations/progress attach directly to books.
- **Books:** EPUB metadata/content/cover extraction. Import and listing.
- **Bookmarks, Annotations, Reading Progress:** Implemented.
- **Missing:** PDF/MOBI parsing, multiple library support, advanced search.

## Gotchas
1. **`libsqlite3-sys`**: Must use `bundled` feature.
2. **Async Runtime**: Everything is Tokio. Blocking code will deadlock.
3. **Test Failures**: Usually missing `#[serial]` or `--test-threads=1`.
4. **DTOs**: Domain models are pure structs. DTOs are in `domain/dto/` with `From<Model>` impls.

## Notes
- Send only raw HTML from handlers to frontend; no CSS or JS processing in backend.
- Old database files are incompatible — they are deleted on first run of the refactored app.

## Instructions for AI Assistants
- USE CONTEXT7 WHEN TRYING TO LOOKUP THE DOCUMENTATION OF USED CRATES/LIBRARIES <-- IMPORTANT
