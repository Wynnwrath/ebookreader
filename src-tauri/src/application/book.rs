use std::path::Path;
use std::sync::Arc;

use serde::Serialize;

use crate::domain::dto::book_dto::BookDto;
use crate::domain::error::DomainError;
use crate::domain::repository::*;
use crate::infrastructure::file_handlers::epub_handler;
use crate::infrastructure::file_handlers::pdf_handler;
use crate::infrastructure::file_handlers::pdf_handler::PdfPage;

#[derive(Serialize, Clone)]
#[serde(tag = "type", content = "data")]
pub enum BookContent {
    Epub(String),
    Pdf(PdfPage),
}

pub async fn get_book(
    find_id: i32,
    book_repo: &Arc<dyn BookRepository>,
    author_repo: &Arc<dyn AuthorRepository>,
    publisher_repo: &Arc<dyn PublisherRepository>,
) -> Result<Option<BookDto>, DomainError> {
    let book = match book_repo.find_by_id(find_id).await? {
        Some(b) => b,
        None => return Ok(None),
    };

    let authors = author_repo.get_authors_by_book(book.id).await?;
    let author = authors.first().map(|a| a.name.clone());

    let publisher = match book.publisher_id {
        Some(pid) => publisher_repo.find_by_id(pid).await?.map(|p| p.name),
        None => None,
    };

    Ok(Some(BookDto::new(&book, author, publisher)))
}

pub async fn get_cover(
    book_id: i32,
    book_repo: &Arc<dyn BookRepository>,
) -> Result<Option<Vec<u8>>, DomainError> {
    let book = book_repo
        .find_by_id(book_id)
        .await?
        .ok_or(DomainError::BookNotFound(book_id))?;

    match book.file_type.as_deref() {
        Some("pdf") => {
            let path = book.file_path.as_deref()
                .ok_or_else(|| DomainError::File("No file path for PDF book".into()))?;
            match pdf_handler::get_pdf_cover(path).await {
                Ok(img) => Ok(Some(img)),
                Err(_) => Ok(None),
            }
        }
        Some("epub") => match epub_handler::get_cover_image_by_book_id(book_id).await {
            Ok(img) => Ok(Some(img)),
            Err(_) => Ok(None),
        },
        _ => Ok(None),
    }
}

pub async fn import_book(
    file_path: &Path,
    book_repo: &Arc<dyn BookRepository>,
    author_repo: &Arc<dyn AuthorRepository>,
    _book_author_repo: &Arc<dyn BookAuthorRepository>,
    publisher_repo: &Arc<dyn PublisherRepository>,
) -> Result<BookDto, DomainError> {
    let ext = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let (metadata, file_type) = match ext.as_str() {
        "pdf" => {
            let meta = pdf_handler::parse_pdf_meta(file_path.to_string_lossy().to_string())
                .await
                .map_err(|e| DomainError::Parse(e.to_string()))?;
            (meta, "pdf".to_string())
        }
        "epub" => {
            let meta = epub_handler::parse_epub_meta(file_path.to_string_lossy().to_string())
                .await
                .map_err(|e| DomainError::Parse(e.to_string()))?;
            (meta, "epub".to_string())
        }
        other => {
            return Err(DomainError::File(format!("Unsupported file type: {}", other)));
        }
    };

    if let Some(_existing) = book_repo.find_by_checksum(&metadata.checksum).await? {
        return Err(DomainError::DuplicateBook(
            file_path.to_string_lossy().to_string(),
        ));
    }

    let mut author_ids = Vec::new();
    for author_name in &metadata.authors {
        let author = author_repo.find_or_create(author_name).await?;
        author_ids.push((author.id, author.name.clone()));
    }

    let publisher_id = if let Some(pub_name) = metadata.publishers.first() {
        let publisher = publisher_repo.find_or_create(pub_name).await?;
        Some(publisher.id)
    } else {
        None
    };

    let book = book_repo
        .import_with_links(
            NewBook {
                title: metadata.title.clone(),
                published_date: metadata.published_date.clone(),
                publisher_id,
                isbn: metadata.isbn.clone(),
                file_type,
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

pub async fn list_books(
    book_repo: &Arc<dyn BookRepository>,
    author_repo: &Arc<dyn AuthorRepository>,
    publisher_repo: &Arc<dyn PublisherRepository>,
) -> Result<Vec<BookDto>, DomainError> {
    let books = book_repo.find_all().await?;
    let mut dtos = Vec::new();

    for book in books {
        let authors = author_repo.get_authors_by_book(book.id).await?;
        let author = authors.first().map(|a| a.name.clone());

        let publisher = match book.publisher_id {
            Some(pid) => publisher_repo.find_by_id(pid).await?.map(|p| p.name),
            None => None,
        };

        dtos.push(BookDto::new(&book, author, publisher));
    }

    Ok(dtos)
}

pub async fn read_epub(path: &str) -> Result<String, DomainError> {
    epub_handler::get_epub_content(path)
        .await
        .map_err(|e| DomainError::Parse(e.to_string()))
}

pub async fn read_book(path: &str, file_type: &str) -> Result<BookContent, DomainError> {
    match file_type {
        "epub" => {
            let html = epub_handler::get_epub_content(path)
                .await
                .map_err(|e| DomainError::Parse(e.to_string()))?;
            Ok(BookContent::Epub(html))
        }
        "pdf" => {
            let page = pdf_handler::read_pdf_page(path, 0)
                .await
                .map_err(|e| DomainError::Parse(e.to_string()))?;
            Ok(BookContent::Pdf(page))
        }
        other => Err(DomainError::File(format!("Unsupported file type: {}", other))),
    }
}

pub async fn remove_book(
    find_id: i32,
    book_repo: &Arc<dyn BookRepository>,
) -> Result<(), DomainError> {
    book_repo.delete(find_id).await
}

pub async fn scan_directory(
    dir_path: &Path,
    book_repo: &Arc<dyn BookRepository>,
    author_repo: &Arc<dyn AuthorRepository>,
    book_author_repo: &Arc<dyn BookAuthorRepository>,
    publisher_repo: &Arc<dyn PublisherRepository>,
) -> Result<Vec<String>, DomainError> {
    let epub_paths = epub_handler::scan_epubs(dir_path.to_path_buf())
        .await
        .map_err(|e| DomainError::File(e.to_string()))?;
    let pdf_paths = pdf_handler::scan_pdfs(dir_path.to_path_buf())
        .await
        .map_err(|e| DomainError::File(e.to_string()))?;

    let mut errors = Vec::new();

    for path in epub_paths.iter().chain(pdf_paths.iter()) {
        if let Err(e) = import_book(
            path,
            book_repo,
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
