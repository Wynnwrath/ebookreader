# Integration Tests

This directory contains integration tests for the Stellaron ebook reader application.

## Test Organization

Tests are organized by module:

- **connection_tests.rs** - Database connection pooling tests
- **library_repo_tests.rs** - Library repository CRUD operations
- **user_repo_tests.rs** - User repository CRUD operations
- **controller_tests.rs** - REST API controller tests (TODO)
- **service_tests.rs** - Business logic service tests (TODO)

## Running Tests

All tests **must** be run with single-threaded execution due to SQLite:

```bash
cargo test -- --test-threads=1
```

## Test Patterns

### Database Tests

All database tests require:
1. `#[tokio::test]` - Async test runtime
2. `#[serial_test::serial]` - Serial execution (one at a time)
3. `setup()` helper - Clears tables before each test

Example:
```rust
async fn setup() -> Result<(), Error> {
    let mut conn = database::connect_from_pool().await?;
    use stellaron_lib::data::models::schema::users::dsl::*;
    diesel::delete(users).execute(&mut conn).await?;
    Ok(())
}

#[tokio::test]
#[serial_test::serial]
async fn test_name() {
    setup().await.expect("Failed to setup");
    // test logic
}
```

### Repository Tests

Repository tests validate:
- CRUD operations (Create, Read, Update, Delete)
- Search/filter functionality
- Error handling (NotFound vs actual errors)
- Return type pattern: `Result<Option<T>, Error>`

### Integration Test Imports

Use the library crate name `stellaron_lib` to import:

```rust
use stellaron_lib::data::database;
use stellaron_lib::data::models::users::NewUser;
use stellaron_lib::data::repos::implementors::user_repo::UserRepo;
use stellaron_lib::data::repos::traits::repository::Repository;
```

## Test Coverage

**Current Coverage:**
- ✅ Database connection pooling
- ✅ Library repository (4 tests)
- ✅ User repository (7 tests)

**Planned:**
- ❌ Author repository
- ❌ Book repository
- ❌ Publisher repository
- ❌ Service layer
- ❌ EPUB handler
- ❌ Authentication

## Contributing Tests

When adding new tests:
1. Create a new file named `{module}_tests.rs`
2. Add `#[serial_test::serial]` to all database tests
3. Include a `setup()` helper to clear relevant tables
4. Document what the test validates in a comment
5. Use descriptive test names: `test_{action}_{scenario}`
