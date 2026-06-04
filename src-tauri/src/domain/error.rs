//! Domain-level error types for Stellaron.
//!
//! All business logic errors are represented as [`DomainError`] variants.
//! Infrastructure errors (Diesel, pool) are automatically converted via `From` impls.

use thiserror::Error;

/// Errors that can occur within the domain layer.
///
/// These cover all failure modes for book management, file parsing,
/// and database operations.
#[derive(Debug, Error)]
pub enum DomainError {
    /// A book with the given ID was not found in the database.
    #[error("Book not found: {0}")]
    BookNotFound(i32),

    /// A book with the same checksum already exists (duplicate import).
    #[error("Duplicate book: {0}")]
    DuplicateBook(String),

    /// A database operation failed.
    #[error("Database error: {0}")]
    Database(String),

    /// A file I/O operation failed.
    #[error("File error: {0}")]
    File(String),

    /// An ebook file could not be parsed (invalid format, corrupt data).
    #[error("Parse error: {0}")]
    Parse(String),

    /// A generic not-found error for non-book lookups.
    #[error("Not found")]
    NotFound,
}

impl From<diesel::result::Error> for DomainError {
    fn from(err: diesel::result::Error) -> Self {
        DomainError::Database(err.to_string())
    }
}

impl From<diesel_async::pooled_connection::deadpool::PoolError> for DomainError {
    fn from(err: diesel_async::pooled_connection::deadpool::PoolError) -> Self {
        DomainError::Database(err.to_string())
    }
}
