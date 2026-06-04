# Domain Layer

The domain layer is the innermost layer of Stellaron's architecture. It contains **pure business models, repository traits, and error types** with zero framework dependencies.

## Module Overview

```
domain/
├── error.rs            # DomainError enum
├── repository.rs       # Repository traits + input structs
├── models/
│   ├── book.rs         # Book entity
│   ├── author.rs       # Author entity
│   ├── publisher.rs    # Publisher entity
│   ├── bookmark.rs     # Bookmark entity
│   ├── annotation.rs   # Annotation entity
│   └── reading_progress.rs  # ReadingProgress entity
└── dto/
    └── book_dto.rs     # BookDto (presentation)
```

## DomainError

```rust
pub enum DomainError {
    BookNotFound(i32),     // Book lookup failed by ID
    DuplicateBook(String), // Checksum collision during import
    Database(String),      // Diesel/pool errors (auto-converted via From)
    File(String),          // File I/O errors
    Parse(String),         // Ebook parsing failures
    NotFound,              // Generic not-found
}
```

Implements `From<diesel::result::Error>` and `From<PoolError>` for automatic conversion.

## Repository Traits

All traits use `#[async_trait]` and require `Send + Sync`:

| Trait | Methods |
|-------|---------|
| `BookRepository` | `find_all`, `find_by_id`, `insert`, `update`, `delete`, `find_by_checksum`, `search_by_title`, `import_with_links` |
| `AuthorRepository` | `find_or_create`, `get_authors_by_book` |
| `PublisherRepository` | `find_by_id`, `find_or_create` |
| `BookAuthorRepository` | `link` |
| `BookmarkRepository` | `find_by_book`, `insert`, `delete` |
| `AnnotationRepository` | `find_by_book`, `insert`, `delete` |
| `ReadingProgressRepository` | `find_by_book`, `upsert` |

### Input Structs

- **`NewBook`** — Required fields: `title`, `file_type`, `file_path`. Optional: `published_date`, `publisher_id`, `isbn`, `cover_image_path`, `checksum`.
- **`UpdateBook`** — All fields optional (partial update).
- **`NewBookmark`** — `book_id`, `position`, optional `chapter_title`/`page_number`.
- **`NewAnnotation`** — `book_id`, `start_position`, `end_position`, optional `chapter_title`/`highlighted_text`/`note`/`color`.
- **`NewReadingProgress`** — `book_id`, `current_position`, optional `chapter_title`/`page_number`/`progress_percentage`.

## Domain Models

### Book

```rust
pub struct Book {
    pub id: i32,
    pub title: String,
    pub published_date: Option<String>,
    pub publisher_id: Option<i32>,
    pub isbn: Option<String>,
    pub file_type: Option<String>,      // "epub", "pdf"
    pub file_path: Option<String>,      // absolute path
    pub cover_image_path: Option<String>,
    pub checksum: Option<String>,       // SHA-256
    pub added_at: Option<String>,       // ISO 8601
}
```

### Author / Publisher

```rust
pub struct Author { pub id: i32, pub name: String }
pub struct Publisher { pub id: i32, pub name: String }
```

### Bookmark

```rust
pub struct Bookmark {
    pub id: i32,
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub position: String,               // EPUB CFI or byte offset
    pub created_at: Option<String>,
}
```

### Annotation

```rust
pub struct Annotation {
    pub id: i32,
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub start_position: String,
    pub end_position: String,
    pub highlighted_text: Option<String>,
    pub note: Option<String>,
    pub color: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
```

### ReadingProgress

```rust
pub struct ReadingProgress {
    pub id: i32,
    pub book_id: i32,
    pub current_position: String,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub progress_percentage: Option<f32>,  // 0.0–100.0
    pub last_read_at: Option<String>,
}
```

## DTOs

### BookDto

Combines a `Book` with resolved author and publisher names for frontend rendering:

```rust
pub struct BookDto {
    pub id: i32,
    pub title: String,
    pub author: Option<String>,        // first author name
    pub published_date: Option<String>,
    pub publisher: Option<String>,     // first publisher name
    pub isbn: Option<String>,
    pub file_type: Option<String>,
    pub file_path: Option<String>,
    pub cover_image_path: Option<String>,
    pub checksum: Option<String>,
    pub added_at: Option<String>,
}
```

Constructed via `BookDto::new(book, author, publisher)`.
