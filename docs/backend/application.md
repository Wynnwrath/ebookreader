# Application Layer

The application layer contains **use-case functions** and **repository implementations** that orchestrate domain models and infrastructure services.

## Module Overview

```
application/
├── state.rs                  # AppState (DI container)
├── book.rs                   # Book use cases
├── bookmark.rs               # Bookmark use cases
├── annotation.rs             # Annotation use cases
├── reading_progress.rs       # Reading progress use cases
├── repository/               # Diesel-backed repo implementations
│   ├── book_repo.rs
│   ├── author_repo.rs
│   ├── publisher_repo.rs
│   ├── book_author_repo.rs
│   ├── bookmark_repo.rs
│   ├── annotation_repo.rs
│   └── reading_progress_repo.rs
└── service/
    └── book_service.rs       # Metadata service
```

## AppState

The dependency injection container, wired in `main.rs` and passed to Tauri commands as `State<'_, AppState>`:

```rust
pub struct AppState {
    pub book_repo: Arc<dyn BookRepository>,
    pub author_repo: Arc<dyn AuthorRepository>,
    pub publisher_repo: Arc<dyn PublisherRepository>,
    pub book_author_repo: Arc<dyn BookAuthorRepository>,
    pub bookmark_repo: Arc<dyn BookmarkRepository>,
    pub annotation_repo: Arc<dyn AnnotationRepository>,
    pub reading_progress_repo: Arc<dyn ReadingProgressRepository>,
}
```

## Use Cases

### Book Operations (`book.rs`)

| Function | Description |
|----------|-------------|
| `get_book(id, book_repo, author_repo, publisher_repo)` | Returns a `BookDto` by ID with resolved author/publisher |
| `get_cover(book_id, book_repo)` | Returns cover image bytes (PDF: first page at 150 DPI, EPUB: embedded cover) |
| `import_book(path, book_repo, author_repo, book_author_repo, publisher_repo)` | Parses file, checks duplicate via SHA-256, creates author/publisher, inserts book with links |
| `list_books(book_repo, author_repo, publisher_repo)` | Returns all books as `Vec<BookDto>` |
| `read_epub(path)` | Returns concatenated HTML with inline base64 images |
| `read_book(path, file_type)` | Returns `BookContent::Epub(html)` or `BookContent::Pdf(page)` |
| `remove_book(id, book_repo)` | Deletes book (cascade deletes associated records) |
| `scan_directory(path, ...)` | Recursively imports EPUBs and PDFs, returns error messages |

### Bookmark Operations (`bookmark.rs`)

| Function | Description |
|----------|-------------|
| `add_bookmark(NewBookmark, bookmark_repo)` | Creates a new bookmark |
| `get_bookmarks(book_id, bookmark_repo)` | Lists bookmarks for a book |
| `delete_bookmark(id, bookmark_repo)` | Deletes a bookmark by ID |

### Annotation Operations (`annotation.rs`)

| Function | Description |
|----------|-------------|
| `add_annotation(NewAnnotation, annotation_repo)` | Creates a new annotation |
| `get_annotations(book_id, annotation_repo)` | Lists annotations for a book |
| `delete_annotation(id, annotation_repo)` | Deletes an annotation by ID |

### Reading Progress Operations (`reading_progress.rs`)

| Function | Description |
|----------|-------------|
| `get_progress(book_id, reading_progress_repo)` | Returns progress or `None` |
| `update_progress(NewReadingProgress, reading_progress_repo)` | Upserts progress (inserts or updates on `book_id` conflict) |

### Metadata Service (`service/book_service.rs`)

| Function | Description |
|----------|-------------|
| `fetch_metadata(book_id, book_repo)` | Re-parses the ebook file and returns fresh `BookMetadata` |
| `list_metadata(book_repo)` | Re-parses all books and returns their metadata |
| `update_metadata(book_name, title, date, isbn, book_repo)` | Updates metadata fields by title search |

## Repository Implementations

All implementations follow the same pattern:

1. **Unit struct** with `::new()` and `Default` impl.
2. **`#[async_trait]` impl** of the domain trait.
3. **Connection acquisition**: `connect_from_pool().await`.
4. **Write operations**: `lock_db().lock().await` → `conn.transaction(...)`.
5. **ID retrieval**: `sql_query("SELECT last_insert_rowid()")`.
6. **Row-to-domain conversion**: `From<Row> for DomainModel`.

### Key Implementation: `BookRepoImpl::import_with_links`

This is the most complex repository method. It:

1. Acquires the write lock and a connection.
2. Inserts the book row inside a transaction.
3. Retrieves the generated book ID via `last_insert_rowid()`.
4. Links all authors via the `book_authors` join table (same transaction).
5. Updates `publisher_id` outside the transaction (separate column update).
6. Returns the fully-hydrated `Book` domain model.

### Key Implementation: `ReadingProgressRepoImpl::upsert`

Uses `ON CONFLICT(book_id) DO UPDATE` for upsert behavior:

```rust
diesel::insert_into(reading_progress::table)
    .values(&new_row)
    .on_conflict(reading_progress::book_id)
    .do_update()
    .set((...))
```

The `last_read_at` timestamp is always set to the current UTC time.

## Database Access Pattern

```rust
use crate::infrastructure::database::database::{connect_from_pool, lock_db};

// Read operations
let mut conn = connect_from_pool().await?;
let rows = books::table.load::<BookRow>(&mut conn).await?;

// Write operations
let _db_lock = lock_db();
let mut conn = connect_from_pool().await?;
conn.transaction(async |connection| {
    diesel::insert_into(books::table)
        .values(&new_row)
        .execute(connection)
        .await?;
    Ok::<(), diesel::result::Error>(())
}).await?;
```
