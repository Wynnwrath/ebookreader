use crate::domain::error::DomainError;
use crate::infrastructure::file_handlers::epub_handler;

pub async fn read_epub(path: &str) -> Result<String, DomainError> {
    epub_handler::get_epub_content(path)
        .await
        .map_err(|e| DomainError::Parse(e.to_string()))
}
