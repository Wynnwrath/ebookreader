use diesel::result::Error;
use diesel_async::RunQueryDsl;

use stellaron_lib::data::database;
use stellaron_lib::data::models::books::{NewBook, UpdateBook};
use stellaron_lib::data::models::publishers::NewPublisher;
use stellaron_lib::data::repos::implementors::book_repo::BookRepo;
use stellaron_lib::data::repos::implementors::publisher_repo::PublisherRepo;
use stellaron_lib::data::repos::traits::repository::Repository;

/// Helper function to clear the tables before each test
async fn setup() -> Result<(), Error> {
    let mut conn = database::connect_from_pool()
        .await
        .expect("Failed to get connection from pool for test setup");

    use stellaron_lib::data::models::schema::authors::dsl::*;
    use stellaron_lib::data::models::schema::book_authors::dsl::*;
    use stellaron_lib::data::models::schema::books::dsl::*;
    use stellaron_lib::data::models::schema::publishers::dsl::*;
    use stellaron_lib::data::models::schema::user_library::dsl::*;
    use stellaron_lib::data::models::schema::users::dsl::*;

    diesel::delete(book_authors).execute(&mut conn).await?;
    diesel::delete(user_library).execute(&mut conn).await?;
    diesel::delete(books).execute(&mut conn).await?;
    diesel::delete(authors).execute(&mut conn).await?;
    diesel::delete(publishers).execute(&mut conn).await?;
    diesel::delete(users).execute(&mut conn).await?;

    Ok(())
}

/// Helper function to create a test publisher and return its ID
async fn create_test_publisher(name_val: &str) -> i32 {
    let repo = PublisherRepo::new().await;
    let new_publisher = NewPublisher { name: name_val };
    repo.add(new_publisher)
        .await
        .expect("Failed to create test publisher");
    let publishers = repo
        .get_all()
        .await
        .expect("Failed to get publishers")
        .unwrap();
    publishers
        .iter()
        .find(|p| p.name == name_val)
        .unwrap()
        .publisher_id
}

/// Helper function to create a test book
async fn create_test_book(title_val: &str, publisher_id_val: i32) -> Result<(), Error> {
    let repo = BookRepo::new().await;
    let new_book = NewBook {
        title: title_val,
        publisher_id: Some(publisher_id_val),
        published_date: None,
        isbn: None,
        file_type: None,
        file_path: None,
        cover_image_path: None,
        checksum: None,
    };

    repo.add(new_book).await
}

/// Helper function to create a test book with checksum
async fn create_test_book_with_checksum(
    title_val: &str,
    publisher_id_val: i32,
    checksum_val: &str,
) -> Result<(), Error> {
    let repo = BookRepo::new().await;
    let new_book = NewBook {
        title: title_val,
        publisher_id: Some(publisher_id_val),
        published_date: None,
        isbn: None,
        file_type: None,
        file_path: None,
        cover_image_path: None,
        checksum: Some(checksum_val),
    };

    repo.add(new_book).await
}

#[tokio::test]
#[serial_test::serial]
async fn test_create_book() {
    setup().await.expect("Failed to set up test");
    let publisher_id = create_test_publisher("Test Publisher").await;

    let title = "Test Book";
    let result = create_test_book(title, publisher_id).await;
    assert!(result.is_ok());

    let repo = BookRepo::new().await;
    let books = repo.get_all().await.expect("Failed to get books");

    assert!(books.is_some());
    let books_vec = books.unwrap();
    assert_eq!(books_vec.len(), 1);
    assert_eq!(books_vec[0].title, title);
    assert_eq!(books_vec[0].publisher_id, Some(publisher_id));
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_all_books_empty() {
    setup().await.expect("Failed to set up test");

    let repo = BookRepo::new().await;
    let books = repo.get_all().await.expect("Failed to get books");

    assert!(books.is_none());
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_book_by_id() {
    setup().await.expect("Failed to set up test");
    let publisher_id = create_test_publisher("Test Publisher").await;

    let title = "Test Book";
    create_test_book(title, publisher_id)
        .await
        .expect("Failed to create test book");

    let repo = BookRepo::new().await;
    let books = repo.get_all().await.expect("Failed to get books").unwrap();
    let book_id = books[0].book_id;

    let book = repo
        .get_by_id(book_id)
        .await
        .expect("Failed to get book by id");

    assert!(book.is_some());
    let found_book = book.unwrap();
    assert_eq!(found_book.title, title);
}

#[tokio::test]
#[serial_test::serial]
async fn test_update_book() {
    setup().await.expect("Failed to set up test");
    let publisher_id = create_test_publisher("Test Publisher").await;

    let title = "Original Title";
    create_test_book(title, publisher_id)
        .await
        .expect("Failed to create test book");

    let repo = BookRepo::new().await;
    let books = repo.get_all().await.expect("Failed to get books").unwrap();
    let book_id = books[0].book_id;

    let new_title = "Updated Title";
    let form = UpdateBook {
        title: Some(new_title),
        published_date: None,
        publisher_id: None,
        isbn: None,
        file_type: None,
        file_path: None,
        cover_image_path: None,
        checksum: None,
    };
    let result = repo.update(book_id, form).await;
    assert!(result.is_ok());

    let updated_book = repo
        .get_by_id(book_id)
        .await
        .expect("Failed to get book by id")
        .unwrap();
    assert_eq!(updated_book.title, new_title);
}

#[tokio::test]
#[serial_test::serial]
async fn test_delete_book() {
    setup().await.expect("Failed to set up test");
    let publisher_id = create_test_publisher("Test Publisher").await;

    let title = "To Be Deleted";
    create_test_book(title, publisher_id)
        .await
        .expect("Failed to create test book");

    let repo = BookRepo::new().await;
    let books = repo.get_all().await.expect("Failed to get books").unwrap();
    let book_id = books[0].book_id;

    let result = repo.delete(book_id).await;
    assert!(result.is_ok());

    let book = repo
        .get_by_id(book_id)
        .await
        .expect("Failed to get book by id");
    assert!(book.is_none());
}

#[tokio::test]
#[serial_test::serial]
async fn test_search_book_by_title() {
    setup().await.expect("Failed to set up test");
    let publisher_id = create_test_publisher("Test Publisher").await;

    create_test_book("The Lord of the Rings", publisher_id)
        .await
        .unwrap();
    create_test_book("The Hobbit", publisher_id).await.unwrap();
    create_test_book("Lord of the Flies", publisher_id)
        .await
        .unwrap();

    let repo = BookRepo::new().await;
    let results = repo
        .search_by_title("Lord")
        .await
        .expect("Failed to search by title")
        .unwrap();

    assert_eq!(results.len(), 2);
    assert!(results.iter().any(|b| b.title == "The Lord of the Rings"));
    assert!(results.iter().any(|b| b.title == "Lord of the Flies"));
}

#[tokio::test]
#[serial_test::serial]
async fn test_search_book_by_publisher() {
    setup().await.expect("Failed to set up test");
    let publisher_id1 = create_test_publisher("Publisher 1").await;
    let publisher_id2 = create_test_publisher("Publisher 2").await;

    create_test_book("Book 1", publisher_id1).await.unwrap();
    create_test_book("Book 2", publisher_id2).await.unwrap();
    create_test_book("Book 3", publisher_id1).await.unwrap();

    let repo = BookRepo::new().await;
    let results = repo
        .search_by_publisher(publisher_id1)
        .await
        .expect("Failed to search by publisher")
        .unwrap();

    assert_eq!(results.len(), 2);
    assert!(results.iter().any(|b| b.title == "Book 1"));
    assert!(results.iter().any(|b| b.title == "Book 3"));
}

#[tokio::test]
#[serial_test::serial]
async fn test_search_book_by_checksum() {
    setup().await.expect("Failed to set up test");
    let publisher_id = create_test_publisher("Test Publisher").await;

    let checksum = "abc123def456";
    create_test_book_with_checksum("Test Book", publisher_id, checksum)
        .await
        .unwrap();

    let repo = BookRepo::new().await;
    let result = repo
        .search_by_checksum(checksum)
        .await
        .expect("Failed to search by checksum");

    assert!(result.is_some());
    let found_book = result.unwrap();
    assert_eq!(found_book.title, "Test Book");
    assert_eq!(found_book.checksum, Some(checksum.to_string()));
}

#[tokio::test]
#[serial_test::serial]
async fn test_search_book_by_checksum_nonexistent() {
    setup().await.expect("Failed to set up test");

    let repo = BookRepo::new().await;
    let result = repo
        .search_by_checksum("nonexistent_checksum")
        .await
        .expect("Failed to execute search_by_checksum");

    assert!(result.is_none());
}

#[tokio::test]
#[serial_test::serial]
async fn test_create_book_with_checksum() {
    setup().await.expect("Failed to set up test");
    let publisher_id = create_test_publisher("Test Publisher").await;

    let title = "Book With Checksum";
    let checksum = "sha256_test_hash_value";
    create_test_book_with_checksum(title, publisher_id, checksum)
        .await
        .expect("Failed to create test book with checksum");

    let repo = BookRepo::new().await;
    let books = repo.get_all().await.expect("Failed to get books");

    assert!(books.is_some());
    let books_vec = books.unwrap();
    assert_eq!(books_vec.len(), 1);
    assert_eq!(books_vec[0].title, title);
    assert_eq!(books_vec[0].checksum, Some(checksum.to_string()));
}
