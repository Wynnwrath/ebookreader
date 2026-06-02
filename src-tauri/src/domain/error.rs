use thiserror::Error;

#[derive(Debug, Error)]
pub enum DomainError {
    #[error("Book not found: {0}")]
    BookNotFound(i32),
    #[error("Duplicate book: {0}")]
    DuplicateBook(String),
    #[error("Database error: {0}")]
    Database(String),
    #[error("File error: {0}")]
    File(String),
    #[error("Parse error: {0}")]
    Parse(String),
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
