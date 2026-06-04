use async_trait::async_trait;

use crate::domain::error::DomainError;
use crate::domain::models::annotation::Annotation;
use crate::domain::models::author::Author;
use crate::domain::models::book::Book;
use crate::domain::models::bookmark::Bookmark;
use crate::domain::models::publisher::Publisher;
use crate::domain::models::reading_progress::ReadingProgress;

/// Input data for creating a new book record.
pub struct NewBook {
    pub title: String,
    pub published_date: Option<String>,
    pub publisher_id: Option<i32>,
    pub isbn: Option<String>,
    pub file_type: String,
    pub file_path: String,
    pub cover_image_path: Option<String>,
    pub checksum: Option<String>,
}

/// Partial update input for an existing book. Only `Some` fields are applied.
pub struct UpdateBook {
    pub title: Option<String>,
    pub published_date: Option<String>,
    pub publisher_id: Option<i32>,
    pub isbn: Option<String>,
    pub file_type: Option<String>,
    pub file_path: Option<String>,
    pub cover_image_path: Option<String>,
    pub checksum: Option<String>,
}

/// Persistence operations for books.
#[async_trait]
pub trait BookRepository: Send + Sync {
    /// Returns all books in the library.
    ///
    /// # Returns
    ///
    /// A vector of all [`Book`] records.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn find_all(&self) -> Result<Vec<Book>, DomainError>;

    /// Returns the book with the given ID.
    ///
    /// # Arguments
    ///
    /// * `id` - The book's database ID.
    ///
    /// # Returns
    ///
    /// `Some(Book)` if found, `None` otherwise.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn find_by_id(&self, id: i32) -> Result<Option<Book>, DomainError>;

    /// Inserts a new book and returns its generated ID.
    ///
    /// # Arguments
    ///
    /// * `book` - The new book data.
    ///
    /// # Returns
    ///
    /// The auto-generated primary key from the database.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on insert failure.
    async fn insert(&self, book: NewBook) -> Result<i32, DomainError>;

    /// Updates an existing book by ID.
    ///
    /// Only `Some` fields in [`UpdateBook`] are applied; `None` fields are left
    /// unchanged.
    ///
    /// # Arguments
    ///
    /// * `id` - The book's database ID.
    /// * `book` - Partial update data.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on update failure.
    async fn update(&self, id: i32, book: UpdateBook) -> Result<(), DomainError>;

    /// Deletes a book by ID.
    ///
    /// Related records (bookmarks, annotations, progress, author links) are
    /// cascade-deleted by SQLite foreign keys.
    ///
    /// # Arguments
    ///
    /// * `id` - The book's database ID.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn delete(&self, id: i32) -> Result<(), DomainError>;

    /// Returns the book matching the given SHA-256 checksum.
    ///
    /// Used for duplicate detection during import.
    ///
    /// # Arguments
    ///
    /// * `checksum` - The SHA-256 hex digest string.
    ///
    /// # Returns
    ///
    /// `Some(Book)` if a book with this checksum exists, `None` otherwise.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn find_by_checksum(&self, checksum: &str) -> Result<Option<Book>, DomainError>;

    /// Returns books whose title contains the given query string.
    ///
    /// Uses a SQL `LIKE` query (`%query%`) for substring matching. Case
    /// sensitivity depends on the SQLite collation.
    ///
    /// # Arguments
    ///
    /// * `title` - Substring to match against book titles.
    ///
    /// # Returns
    ///
    /// A (possibly empty) vector of matching [`Book`] records.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn search_by_title(&self, title: &str) -> Result<Vec<Book>, DomainError>;

    /// Imports a new book with author and publisher links in a single transaction.
    ///
    /// Inserts the book, links each author via the join table, and associates
    /// the publisher. Returns the fully-hydrated [`Book`] with its generated ID.
    ///
    /// # Arguments
    ///
    /// * `book` - The new book data.
    /// * `author_ids` - Slice of `(author_id, author_name)` tuples to link.
    /// * `publisher_id` - Optional publisher to associate.
    ///
    /// # Returns
    ///
    /// The fully-hydrated [`Book`] including generated ID and any foreign key
    /// links.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] if the insert or any link operation
    /// fails.
    async fn import_with_links(
        &self,
        book: NewBook,
        author_ids: &[(i32, String)],
        publisher_id: Option<i32>,
    ) -> Result<Book, DomainError>;
}

/// Persistence operations for authors.
#[async_trait]
pub trait AuthorRepository: Send + Sync {
    /// Returns an existing author by name, or creates and returns a new one.
    ///
    /// # Arguments
    ///
    /// * `name` - The author's full name.
    ///
    /// # Returns
    ///
    /// The existing or newly-created [`Author`].
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query or insert failure.
    async fn find_or_create(&self, name: &str) -> Result<Author, DomainError>;

    /// Returns all authors linked to the given book.
    ///
    /// # Arguments
    ///
    /// * `book_id` - The book's database ID.
    ///
    /// # Returns
    ///
    /// A vector of [`Author`] entities linked via `book_authors`.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn get_authors_by_book(&self, book_id: i32) -> Result<Vec<Author>, DomainError>;
}

/// Persistence operations for publishers.
#[async_trait]
pub trait PublisherRepository: Send + Sync {
    /// Returns the publisher with the given ID.
    ///
    /// # Arguments
    ///
    /// * `id` - The publisher's database ID.
    ///
    /// # Returns
    ///
    /// `Some(Publisher)` if found, `None` otherwise.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn find_by_id(&self, id: i32) -> Result<Option<Publisher>, DomainError>;

    /// Returns an existing publisher by name, or creates and returns a new one.
    ///
    /// # Arguments
    ///
    /// * `name` - The publisher's name.
    ///
    /// # Returns
    ///
    /// The existing or newly-created [`Publisher`].
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query or insert failure.
    async fn find_or_create(&self, name: &str) -> Result<Publisher, DomainError>;
}

/// Persistence operations for the book-author many-to-many join table.
#[async_trait]
pub trait BookAuthorRepository: Send + Sync {
    /// Creates a link between a book and an author.
    ///
    /// # Arguments
    ///
    /// * `book_id` - The book's database ID.
    /// * `author_id` - The author's database ID.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on insert failure.
    async fn link(&self, book_id: i32, author_id: i32) -> Result<(), DomainError>;
}

/// Persistence operations for bookmarks.
#[async_trait]
pub trait BookmarkRepository: Send + Sync {
    /// Returns all bookmarks belonging to the given book.
    ///
    /// # Arguments
    ///
    /// * `book_id` - The book's database ID.
    ///
    /// # Returns
    ///
    /// A vector of [`Bookmark`] entities for the book.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn find_by_book(&self, book_id: i32) -> Result<Vec<Bookmark>, DomainError>;

    /// Creates a new bookmark.
    ///
    /// # Arguments
    ///
    /// * `bookmark` - The bookmark data to insert.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on insert failure.
    async fn insert(&self, bookmark: NewBookmark) -> Result<(), DomainError>;

    /// Deletes a bookmark by ID.
    ///
    /// # Arguments
    ///
    /// * `id` - The bookmark's database ID.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn delete(&self, id: i32) -> Result<(), DomainError>;
}

/// Input data for creating a new bookmark.
pub struct NewBookmark {
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub position: String,
}

/// Persistence operations for annotations (highlights with optional notes).
#[async_trait]
pub trait AnnotationRepository: Send + Sync {
    /// Returns all annotations belonging to the given book.
    ///
    /// # Arguments
    ///
    /// * `book_id` - The book's database ID.
    ///
    /// # Returns
    ///
    /// A vector of [`Annotation`] entities for the book.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn find_by_book(&self, book_id: i32) -> Result<Vec<Annotation>, DomainError>;

    /// Creates a new annotation.
    ///
    /// # Arguments
    ///
    /// * `annotation` - The annotation data to insert.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on insert failure.
    async fn insert(&self, annotation: NewAnnotation) -> Result<(), DomainError>;

    /// Deletes an annotation by ID.
    ///
    /// # Arguments
    ///
    /// * `id` - The annotation's database ID.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn delete(&self, id: i32) -> Result<(), DomainError>;
}

/// Input data for creating a new annotation.
pub struct NewAnnotation {
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub start_position: String,
    pub end_position: String,
    pub highlighted_text: Option<String>,
    pub note: Option<String>,
    pub color: Option<String>,
}

/// Persistence operations for reading progress.
#[async_trait]
pub trait ReadingProgressRepository: Send + Sync {
    /// Returns the reading progress for a given book.
    ///
    /// # Arguments
    ///
    /// * `book_id` - The book's database ID.
    ///
    /// # Returns
    ///
    /// `Some(ReadingProgress)` if tracked, `None` if the book has never been
    /// opened.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn find_by_book(&self, book_id: i32) -> Result<Option<ReadingProgress>, DomainError>;

    /// Inserts or updates reading progress for a book (upsert).
    ///
    /// If a progress record already exists for the book, its fields are
    /// updated; otherwise a new record is created. The `last_read_at` timestamp
    /// is set automatically to the current UTC time.
    ///
    /// # Arguments
    ///
    /// * `progress` - The reading progress data to insert or merge.
    ///
    /// # Errors
    ///
    /// Returns [`DomainError::Database`] on query failure.
    async fn upsert(&self, progress: NewReadingProgress) -> Result<(), DomainError>;
}

/// Input data for creating or updating reading progress.
pub struct NewReadingProgress {
    pub book_id: i32,
    pub current_position: String,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub progress_percentage: Option<f32>,
}
