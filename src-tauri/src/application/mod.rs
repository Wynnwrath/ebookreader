//! Application layer — use-case functions and repository implementations.
//!
//! Each use-case function in this layer orchestrates domain models and
//! repository calls to fulfill a specific business operation. Repository
//! implementations use Diesel async to persist data in SQLite.

pub mod repository;
pub mod service;
pub mod state;

pub mod annotation;
pub mod book;
pub mod bookmark;
pub mod reading_progress;
