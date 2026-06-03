use std::sync::Arc;

use crate::domain::error::DomainError;
use crate::domain::models::annotation::Annotation;
use crate::domain::repository::*;

pub async fn add_annotation(
    annotation: NewAnnotation,
    annotation_repo: &Arc<dyn AnnotationRepository>,
) -> Result<(), DomainError> {
    annotation_repo.insert(annotation).await
}

pub async fn get_annotations(
    book_id: i32,
    annotation_repo: &Arc<dyn AnnotationRepository>,
) -> Result<Vec<Annotation>, DomainError> {
    annotation_repo.find_by_book(book_id).await
}

pub async fn delete_annotation(
    id: i32,
    annotation_repo: &Arc<dyn AnnotationRepository>,
) -> Result<(), DomainError> {
    annotation_repo.delete(id).await
}
