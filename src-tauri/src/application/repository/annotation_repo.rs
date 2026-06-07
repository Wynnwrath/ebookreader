use async_trait::async_trait;
use diesel::prelude::*;
use diesel_async::{AsyncConnection, RunQueryDsl};

use crate::domain::error::DomainError;
use crate::domain::models::annotation::Annotation;
use crate::domain::repository::{AnnotationRepository, NewAnnotation};
use crate::infrastructure::database::database::{connect_from_pool, lock_db};
use crate::infrastructure::database::models::annotation::{AnnotationRow, NewAnnotationRow};
use crate::infrastructure::database::models::schema::annotations;

/// Diesel-backed implementation of [`AnnotationRepository`].
pub struct AnnotationRepoImpl;

impl AnnotationRepoImpl {
    pub fn new() -> Self {
        Self
    }
}

impl Default for AnnotationRepoImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AnnotationRepository for AnnotationRepoImpl {
    /// Returns all annotations for the given book.
    async fn find_by_book(&self, find_book_id: i32) -> Result<Vec<Annotation>, DomainError> {
        let mut conn = connect_from_pool().await?;

        let rows = annotations::dsl::annotations
            .filter(annotations::book_id.eq(find_book_id))
            .load::<AnnotationRow>(&mut conn)
            .await?;

        Ok(rows.into_iter().map(Annotation::from).collect())
    }

    /// Inserts a new annotation.
    async fn insert(&self, annotation: NewAnnotation) -> Result<(), DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        let new_row = NewAnnotationRow {
            book_id: annotation.book_id,
            chapter_title: annotation.chapter_title.as_deref(),
            start_position: &annotation.start_position,
            end_position: &annotation.end_position,
            highlighted_text: annotation.highlighted_text.as_deref(),
            note: annotation.note.as_deref(),
            color: annotation.color.as_deref(),
        };

        conn.transaction(async |connection| {
            diesel::insert_into(annotations::table)
                .values(&new_row)
                .execute(connection)
                .await?;
            Ok::<(), diesel::result::Error>(())
        }).await?;

        Ok(())
    }

    /// Deletes an annotation by ID.
    async fn delete(&self, find_id: i32) -> Result<(), DomainError> {
        let _db_lock = lock_db();
        let mut conn = connect_from_pool().await?;

        conn.transaction(async |connection| {
            diesel::delete(
                annotations::dsl::annotations.filter(annotations::annotation_id.eq(find_id)),
            )
                .execute(connection)
                .await?;
            Ok::<(), diesel::result::Error>(())
        })
        .await?;

        Ok(())
    }
}
