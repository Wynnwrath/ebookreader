use crate::domain::repository::BookRepository;
use crate::infrastructure::file_handlers::epub_handler::BookMetadata;
use std::sync::Arc;

pub async fn fetch_metadata(
    book_id: i32,
    book_repo: &Arc<dyn BookRepository>,
) -> Result<Option<BookMetadata>, crate::domain::error::DomainError> {
    let book = match book_repo.find_by_id(book_id).await? {
        Some(b) => b,
        None => return Ok(None),
    };

    let path = match book.file_path {
        Some(ref p) => p.clone(),
        None => {
            return Err(crate::domain::error::DomainError::File(
                "No file path".into(),
            ));
        }
    };

    let metadata = crate::infrastructure::file_handlers::epub_handler::parse_epub_meta(path)
        .await
        .map_err(|e| crate::domain::error::DomainError::Parse(e.to_string()))?;

    Ok(Some(metadata))
}

pub async fn list_metadata(
    book_repo: &Arc<dyn crate::domain::repository::BookRepository>,
) -> Result<Vec<BookMetadata>, crate::domain::error::DomainError> {
    let books = book_repo.find_all().await?;
    let mut all_metadata = Vec::new();

    for book in books {
        if let Some(ref path) = book.file_path
            && let Ok(meta) =
                crate::infrastructure::file_handlers::epub_handler::parse_epub_meta(path.clone())
                    .await
        {
            all_metadata.push(meta);
        }
    }

    Ok(all_metadata)
}

pub async fn update_metadata(
    book_name: &str,
    title: Option<&str>,
    published_date: Option<&str>,
    isbn: Option<&str>,
    book_repo: &Arc<dyn BookRepository>,
) -> Result<(), crate::domain::error::DomainError> {
    let books = book_repo.search_by_title(book_name).await?;
    let book = books
        .into_iter()
        .next()
        .ok_or(crate::domain::error::DomainError::NotFound)?;

    book_repo
        .update(
            book.id,
            crate::domain::repository::UpdateBook {
                title: title.map(|s| s.to_string()),
                published_date: published_date.map(|s| s.to_string()),
                publisher_id: None,
                isbn: isbn.map(|s| s.to_string()),
                file_type: None,
                file_path: None,
                cover_image_path: None,
                checksum: None,
            },
        )
        .await
}
