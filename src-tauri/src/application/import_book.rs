use std::path::Path;
use std::sync::Arc;

use crate::application::repository::book_repo::BookRepoImpl;
use crate::domain::dto::book_dto::BookDto;
use crate::domain::error::DomainError;
use crate::domain::repository::*;
use crate::infrastructure::file_handlers::epub_handler;

pub async fn import_book(
    file_path: &Path,
    book_repo: &BookRepoImpl,
    author_repo: &Arc<dyn AuthorRepository>,
    _book_author_repo: &Arc<dyn BookAuthorRepository>,
    publisher_repo: &Arc<dyn PublisherRepository>,
) -> Result<BookDto, DomainError> {
    let metadata = epub_handler::parse_epub_meta(file_path.to_string_lossy().to_string())
        .await
        .map_err(|e| DomainError::Parse(e.to_string()))?;

    // Check for duplicate (use trait method)
    let book_repo_trait: &dyn BookRepository = book_repo;
    if let Some(_existing) = book_repo_trait.find_by_checksum(&metadata.checksum).await? {
        return Err(DomainError::DuplicateBook(
            file_path.to_string_lossy().to_string(),
        ));
    }

    // Resolve authors outside transaction (idempotent)
    let mut author_ids = Vec::new();
    for author_name in &metadata.authors {
        let author = author_repo.find_or_create(author_name).await?;
        author_ids.push((author.id, author.name.clone()));
    }

    // Resolve publisher outside transaction (idempotent)
    let publisher_id = if let Some(pub_name) = metadata.publishers.first() {
        let publisher = publisher_repo.find_or_create(pub_name).await?;
        Some(publisher.id)
    } else {
        None
    };

    // Single transaction: insert book + link all authors
    let book = book_repo
        .import_with_links(
            NewBook {
                title: metadata.title.clone(),
                published_date: metadata.published_date.clone(),
                publisher_id,
                isbn: metadata.isbn.clone(),
                file_type: "epub".to_string(),
                file_path: metadata.file_path.clone(),
                cover_image_path: None,
                checksum: Some(metadata.checksum.clone()),
            },
            &author_ids,
            publisher_id,
        )
        .await?;

    Ok(BookDto::new(
        &book,
        metadata.authors.first().cloned(),
        metadata.publishers.first().cloned(),
    ))
}
