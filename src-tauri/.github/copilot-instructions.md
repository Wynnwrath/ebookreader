# Stellaron - Ebook Reader Project (Backend)

## Architecture Overview 

**Tauri v2** desktop app with **dual execution contexts** sharing a single SQLite database:
1. **Tauri GUI** - Window management + IPC commands (stubs in `commands/`).
2. **Axum REST API** (`api.rs`) - Runs on `127.0.0.1:3000` as a background Tokio task.

**Key Constraint:** Both contexts share the same `deadpool::Pool<SyncConnectionWrapper<SqliteConnection>>`. The API spawns in `main()` before the Tauri builder.

### Layer Architecture
`[Client] -> [Controllers] -> [Services] -> [Repositories] -> [Database]`

## Project Structure
- `src/api.rs`: Axum router. **Update here when adding endpoints.**
- `src/lib.rs`: Crate root (`stellaron_lib`).
- `src/controllers/`: HTTP handlers. Return `impl IntoResponse`.
- `src/services/`: Business logic (e.g., `BookService`, `TokenService`).
- `src/data/repos/`: `Repository` trait and implementations (`UserRepo`, `BookRepo`).
- `src/data/models/`: Diesel structs (`Queryable`, `Insertable`).
- `src/handlers/`: File parsers (EPUB via `rbook`, PDF, MOBI).

## Critical Developer Workflows

### Database & Migrations
- **Setup:** `set -x DATABASE_URL sqlite://stellaron.db` (Fish) or `.env`.
- **Migrations:** `diesel migration generate <name>`, `diesel migration run`, `diesel migration redo`.
- **Rule:** Always commit `src/data/models/schema.rs` after migrations.

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
use crate::data::database::{connect_from_pool, lock_db};
let mut conn = connect_from_pool().await?;
let db_lock = lock_db();
let _guard = db_lock.lock().await; // Critical for SQLite writes
```

### 2. Repository Pattern
Implement `Repository` trait (`src/data/repos/traits/repository.rs`) for standard CRUD.
- **GATs:** Use lifetimes for `NewItem<'a>` to avoid allocations.
- **Return Type:** `Result<Option<T>, Error>` (Ok(None) = Not Found).

### 3. Service Singletons
Use `once_cell::sync::Lazy` for services needing shared state (e.g., `Tokenizer`).

## Implementation Status (Dec 2025)
- **Auth:** Login, Register, Refresh Token, Logout (Implemented).
- **Books:** Metadata/Content extraction (EPUB), Search (Implemented).
- **User Data:** Bookmarks, Annotations, Reading Progress (Implemented).
- **Missing:** PDF/MOBI parsing, Advanced OPDS, Tauri IPC commands.

## Gotchas
1. **`libsqlite3-sys`**: Must use `bundled` feature.
2. **Async Runtime**: Everything is Tokio. Blocking code will deadlock.
3. **Test Failures**: Usually missing `#[serial]` or `--test-threads=1`.
4. **DTOs**: Never return raw Models (contain `password_hash`). Use DTOs.

## Data Flow (Native)
1. Frontend (Tauri) sends IPC command contained within `src/commands/`
2. IPC command calls Service layer (e.g., BookService) for business logic
3. Service calls Repository layer (e.g., BookRepo) for data access
4. Repository interacts with Database via Diesel ORM
5. If repo returns a raw path. Service may call the handlers to process it further (e.g., read file contents) 
6. Processed data returns back up the chain to Frontend

## Data Flow (API)
1. Frontend sends HTTP request to Axum REST API (e.g., `/register`)
2. API route calls corresponding Controller function (e.g., `user_controller::create_user`)
3. Controller invokes Service layer (e.g., UserService) for business logic
4. Service calls Repository layer (e.g., UserRepo) for data access and then branches into two(2) possible flows:
   - If the repository returns a raw path to a file, the Service may call the appropriate handler to process the apropriate filetype (e.g., read metadata/contents from an epub file).
   - Else, it continues the normal data flow.
5. Repository interacts with Database via Diesel ORM
6. Data returns back up the chain to Controller
7. Controller converts Models to DTOs and sends HTTP response back to Frontend

## Planned features (backend)
- [] Read and process the following ebook formats to be sent as raw html to be rendered to the tauri frontend: MOBI, PDF, EPUB (partial)
- [] Implement Authentication with JWT tokens and refresh tokens (use axum-extras and jsonwebtoken crate)
- [] Bookmarking and Annotations
- [] OPDS feed generation and navigation for remote access
- [] Cover image extraction and caching
- [] (Optional) Dictionary lookup of highlighted words <-- DO NOT IMPLEMENT YET (TO BE IMPLEMENTED IN THE FRONTEND)
- [] Multiple library support per user
- [] Sync reading progress across clients via REST API
- [] Advanced search and filtering options

## Notes
- Send only raw html from handlers to frontend; no CSS or JS processing in backend

## Instructions for AI Assistants
- USE CONTEXT7 WHEN TRYING TO LOOKUP THE DOCUMENTATION OF USED CRATES/LIBRARIES <-- IMPORTANT