use std::sync::Arc;

use crate::domain::error::DomainError;
use crate::domain::models::annotation::Annotation;
use crate::domain::repository::*;

/// Creates a new annotation (highlight with optional note) for a book.
///
/// # Arguments
///
/// * `annotation` - The annotation data (positions, text, note, color).
/// * `annotation_repo` - Repository for inserting the annotation.
///
/// # Errors
///
/// Delegates to the repository; returns [`DomainError::Database`] on failure.
pub async fn add_annotation(
    annotation: NewAnnotation,
    annotation_repo: &Arc<dyn AnnotationRepository>,
) -> Result<(), DomainError> {
    annotation_repo.insert(annotation).await
}

/// Returns all annotations for the given book.
///
/// # Arguments
///
/// * `book_id` - The book's database ID.
/// * `annotation_repo` - Repository for querying annotations.
///
/// # Returns
///
/// A vector of [`Annotation`] entities belonging to the book.
///
/// # Errors
///
/// Delegates to the repository; returns [`DomainError::Database`] on failure.
pub async fn get_annotations(
    book_id: i32,
    annotation_repo: &Arc<dyn AnnotationRepository>,
) -> Result<Vec<Annotation>, DomainError> {
    annotation_repo.find_by_book(book_id).await
}

/// Deletes an annotation by ID.
///
/// # Arguments
///
/// * `id` - The annotation's database ID.
/// * `annotation_repo` - Repository for deleting the annotation.
///
/// # Errors
///
/// Delegates to the repository; returns [`DomainError::Database`] on failure.
/// No error is returned if the ID does not exist.
pub async fn delete_annotation(
    id: i32,
    annotation_repo: &Arc<dyn AnnotationRepository>,
) -> Result<(), DomainError> {
    annotation_repo.delete(id).await
}
