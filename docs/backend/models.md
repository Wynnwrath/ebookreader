# Data Models

Stellaron's data models are organized in three tiers: **domain models** (pure Rust structs), **DTOs** (presentation), and **ORM rows** (Diesel persistence).

## Entity Relationship Diagram

```
┌──────────────┐       ┌────────────────┐       ┌──────────────┐
│   publishers │       │  book_authors  │       │   authors    │
│──────────────│       │────────────────│       │──────────────│
│ publisher_id │◄──┐   │ book_id     FK │   ┌──►│ author_id    │
│ name         │   └───│ author_id   FK │───┘   │ name         │
└──────────────┘       └────────────────┘       └──────────────┘
       ▲
       │
┌──────────────┐       ┌────────────────┐       ┌──────────────────┐
│    books     │       │   bookmarks    │       │   annotations    │
│──────────────│       │────────────────│       │──────────────────│
│ book_id  PK  │◄──────│ book_id     FK │       │ book_id       FK │
│ title        │   ┌───│ bookmark_id PK │       │ annotation_id PK │
│ published_date│  │   │ chapter_title  │       │ start_position   │
│ publisher_id │───┘   │ page_number    │       │ end_position     │
│ isbn         │       │ position       │       │ highlighted_text │
│ file_type    │       │ created_at     │       │ note             │
│ file_path    │       └────────────────┘       │ color            │
│ cover_image_path│                              │ created_at       │
│ checksum     │       ┌──────────────────┐     │ updated_at       │
│ added_at     │◄──────│ reading_progress │     └──────────────────┘
└──────────────┘       │──────────────────│
                       │ book_id       FK │
                       │ current_position │
                       │ chapter_title    │
                       │ page_number      │
                       │ progress_percentage│
                       │ last_read_at     │
                       └──────────────────┘
```

## Domain Models

Domain models are pure Rust structs with no ORM annotations. They represent the business data as used by application-layer use cases.

### Book

| Field | Type | Description |
|-------|------|-------------|
| `id` | `i32` | Auto-generated primary key |
| `title` | `String` | Book title from ebook metadata |
| `published_date` | `Option<String>` | Publication date string |
| `publisher_id` | `Option<i32>` | FK to publishers table |
| `isbn` | `Option<String>` | ISBN identifier |
| `file_type` | `Option<String>` | `"epub"` or `"pdf"` |
| `file_path` | `Option<String>` | Absolute path to ebook file |
| `cover_image_path` | `Option<String>` | Cached cover image path |
| `checksum` | `Option<String>` | SHA-256 for duplicate detection |
| `added_at` | `Option<String>` | ISO 8601 import timestamp |

### Author

| Field | Type | Description |
|-------|------|-------------|
| `id` | `i32` | Auto-generated primary key |
| `name` | `String` | Author's full name |

### Publisher

| Field | Type | Description |
|-------|------|-------------|
| `id` | `i32` | Auto-generated primary key |
| `name` | `String` | Publisher name |

### Bookmark

| Field | Type | Description |
|-------|------|-------------|
| `id` | `i32` | Auto-generated primary key |
| `book_id` | `i32` | FK to books table |
| `chapter_title` | `Option<String>` | Chapter where bookmark was placed |
| `page_number` | `Option<i32>` | Page number (PDF) |
| `position` | `String` | Position identifier (EPUB CFI, offset) |
| `created_at` | `Option<String>` | ISO 8601 creation timestamp |

### Annotation

| Field | Type | Description |
|-------|------|-------------|
| `id` | `i32` | Auto-generated primary key |
| `book_id` | `i32` | FK to books table |
| `chapter_title` | `Option<String>` | Chapter containing the annotation |
| `start_position` | `String` | Start of highlighted text |
| `end_position` | `String` | End of highlighted text |
| `highlighted_text` | `Option<String>` | Actual highlighted content |
| `note` | `Option<String>` | User-written note |
| `color` | `Option<String>` | Highlight color identifier |
| `created_at` | `Option<String>` | ISO 8601 creation timestamp |
| `updated_at` | `Option<String>` | ISO 8601 modification timestamp |

### ReadingProgress

| Field | Type | Description |
|-------|------|-------------|
| `id` | `i32` | Auto-generated primary key |
| `book_id` | `i32` | FK to books table (unique) |
| `current_position` | `String` | Current reading position |
| `chapter_title` | `Option<String>` | Current chapter |
| `page_number` | `Option<i32>` | Current page (PDF) |
| `progress_percentage` | `Option<f32>` | Completion 0.0–100.0 |
| `last_read_at` | `Option<String>` | ISO 8601 last-read timestamp |

## DTOs

### BookDto

Combines a `Book` with resolved author and publisher names for frontend rendering. Serializes to JSON for Tauri IPC.

```json
{
  "id": 1,
  "title": "Example Book",
  "author": "Author Name",
  "published_date": "2024-01-15",
  "publisher": "Publisher Name",
  "isbn": "978-0-123456-78-9",
  "file_type": "epub",
  "file_path": "/path/to/book.epub",
  "cover_image_path": null,
  "checksum": "abc123...",
  "added_at": "2024-06-01 12:00:00"
}
```

## ORM Row Types

Diesel ORM models map directly to SQLite columns. Key differences from domain models:

- Primary keys are `Option<i32>` (Diesel SQLite requirement for auto-increment).
- Required string columns (`file_type`, `file_path`) are non-optional in rows but `Option` in domain models.
- `From<Row> for DomainModel` handles the conversion with `unwrap_or(0)` for IDs.

### Conversion Examples

```rust
// Domain → Row (for inserts)
impl From<&Book> for BookRow {
    fn from(book: &Book) -> Self {
        BookRow {
            book_id: Some(book.id),
            title: book.title.clone(),
            file_type: book.file_type.clone().unwrap_or_default(),
            // ...
        }
    }
}

// Row → Domain (for queries)
impl From<BookRow> for Book {
    fn from(row: BookRow) -> Self {
        Book {
            id: row.book_id.unwrap_or(0),
            file_type: Some(row.file_type),
            file_path: Some(row.file_path),
            // ...
        }
    }
}
```
