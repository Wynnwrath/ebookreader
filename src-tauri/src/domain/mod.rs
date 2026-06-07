//! Domain layer — pure business models, repository traits, and error types.
//!
//! This layer has **no framework dependencies**. It defines the contracts
//! (traits) that infrastructure and application layers implement.

pub mod dto;
pub mod error;
pub mod models;
pub mod repository;
