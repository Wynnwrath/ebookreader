//! Diesel ORM row types and auto-generated schema.
//!
//! Each module defines a `*Row` struct (queryable), a `New*Row` struct
//! (insertable), and `From` impls that convert between ORM rows and domain
//! models.

pub mod annotation;
pub mod author;
pub mod book;
pub mod book_author;
pub mod bookmark;
pub mod publisher;
pub mod reading_progress;
pub mod schema;
