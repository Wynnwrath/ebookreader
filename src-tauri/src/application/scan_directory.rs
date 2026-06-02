use std::path::Path;
use std::sync::Arc;

use crate::application::repository::book_repo::BookRepoImpl;
use crate::domain::error::DomainError;
use crate::domain::repository::*;
use crate::infrastructure::file_handlers::epub_handler;

pub async fn scan_directory(
    dir_path: &Path,
    _book_repo: &Arc<dyn BookRepository>,
    author_repo: &Arc<dyn AuthorRepository>,
    book_author_repo: &Arc<dyn BookAuthorRepository>,
    publisher_repo: &Arc<dyn PublisherRepository>,
) -> Result<Vec<String>, DomainError> {
    let epubs = epub_handler::scan_epubs(dir_path.to_path_buf())
        .await
        .map_err(|e| DomainError::File(e.to_string()))?;

    let book_repo_impl = BookRepoImpl::new();
    let mut errors = Vec::new();

    for path in &epubs {
        if let Err(e) = crate::application::import_book::import_book(
            path,
            &book_repo_impl,
            author_repo,
            book_author_repo,
            publisher_repo,
        )
        .await
        {
            eprintln!(
                "Failed to import {:?}: {}",
                path.file_name().unwrap_or_default(),
                e
            );
            errors.push(format!("{:?}: {}", path.file_name().unwrap_or_default(), e));
        }
    }

    Ok(errors)
}
