//! Stellaron — a Tauri v2 desktop ebook reader.
//!
//! This crate provides the backend for Stellaron, organized in a layered
//! architecture:
//!
//! - **`domain`** — Pure domain models, repository traits, and error types
//!   with no framework dependencies.
//! - **`application`** — Use-case functions and Diesel-backed repository
//!   implementations wired together via [`application::state::AppState`].
//! - **`infrastructure`** — Database connection pool, Diesel ORM models,
//!   schema, and ebook file parsers (EPUB, PDF, MOBI).
//! - **`api`** — Tauri IPC command handlers that bridge the frontend to the
//!   application layer.
//! - **`utils`** — Shared helpers for checksums and serialization.

pub mod api;
pub mod application;
pub mod domain;
pub mod infrastructure;
pub mod utils;
