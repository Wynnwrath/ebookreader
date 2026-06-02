use async_trait::async_trait;

use crate::domain::error::DomainError;
use crate::domain::models::annotation::Annotation;
use crate::domain::models::author::Author;
use crate::domain::models::book::Book;
use crate::domain::models::bookmark::Bookmark;
use crate::domain::models::publisher::Publisher;
use crate::domain::models::reading_progress::ReadingProgress;

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

#[async_trait]
pub trait BookRepository: Send + Sync {
    async fn find_all(&self) -> Result<Vec<Book>, DomainError>;
    async fn find_by_id(&self, id: i32) -> Result<Option<Book>, DomainError>;
    async fn insert(&self, book: NewBook) -> Result<i32, DomainError>;
    async fn update(&self, id: i32, book: UpdateBook) -> Result<(), DomainError>;
    async fn delete(&self, id: i32) -> Result<(), DomainError>;
    async fn find_by_checksum(&self, checksum: &str) -> Result<Option<Book>, DomainError>;
    async fn search_by_title(&self, title: &str) -> Result<Vec<Book>, DomainError>;
}

#[async_trait]
pub trait AuthorRepository: Send + Sync {
    async fn find_or_create(&self, name: &str) -> Result<Author, DomainError>;
    async fn get_authors_by_book(&self, book_id: i32) -> Result<Vec<Author>, DomainError>;
}

#[async_trait]
pub trait PublisherRepository: Send + Sync {
    async fn find_by_id(&self, id: i32) -> Result<Option<Publisher>, DomainError>;
    async fn find_or_create(&self, name: &str) -> Result<Publisher, DomainError>;
}

#[async_trait]
pub trait BookAuthorRepository: Send + Sync {
    async fn link(&self, book_id: i32, author_id: i32) -> Result<(), DomainError>;
}

#[async_trait]
pub trait BookmarkRepository: Send + Sync {
    async fn find_by_book(&self, book_id: i32) -> Result<Vec<Bookmark>, DomainError>;
    async fn insert(&self, bookmark: NewBookmark) -> Result<(), DomainError>;
    async fn delete(&self, id: i32) -> Result<(), DomainError>;
}

pub struct NewBookmark {
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub position: String,
}

#[async_trait]
pub trait AnnotationRepository: Send + Sync {
    async fn find_by_book(&self, book_id: i32) -> Result<Vec<Annotation>, DomainError>;
    async fn insert(&self, annotation: NewAnnotation) -> Result<(), DomainError>;
    async fn delete(&self, id: i32) -> Result<(), DomainError>;
}

pub struct NewAnnotation {
    pub book_id: i32,
    pub chapter_title: Option<String>,
    pub start_position: String,
    pub end_position: String,
    pub highlighted_text: Option<String>,
    pub note: Option<String>,
    pub color: Option<String>,
}

#[async_trait]
pub trait ReadingProgressRepository: Send + Sync {
    async fn find_by_book(&self, book_id: i32) -> Result<Option<ReadingProgress>, DomainError>;
    async fn upsert(&self, progress: NewReadingProgress) -> Result<(), DomainError>;
}

pub struct NewReadingProgress {
    pub book_id: i32,
    pub current_position: String,
    pub chapter_title: Option<String>,
    pub page_number: Option<i32>,
    pub progress_percentage: Option<f32>,
}
