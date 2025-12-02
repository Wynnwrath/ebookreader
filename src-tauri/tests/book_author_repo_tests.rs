use diesel::result::Error;
use diesel_async::RunQueryDsl;

use stellaron_lib::data::database;
use stellaron_lib::data::models::authors::NewAuthor;
use stellaron_lib::data::models::book_authors::BookAuthors;
use stellaron_lib::data::models::books::NewBook;
use stellaron_lib::data::models::publishers::NewPublisher;
use stellaron_lib::data::repos::implementors::author_repo::AuthorRepo;
use stellaron_lib::data::repos::implementors::book_author_repo::BookAuthorRepo;
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

/// Helper function to create a test author and return its ID
async fn create_test_author(name_val: &str) -> i32 {
    let repo = AuthorRepo::new().await;
    let new_author = NewAuthor { name: name_val };
    repo.add(new_author)
        .await
        .expect("Failed to create test author");
    let authors = repo
        .get_all()
        .await
        .expect("Failed to get authors")
        .unwrap();
    authors
        .iter()
        .find(|a| a.name == name_val)
        .unwrap()
        .author_id
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
    publishers[0].publisher_id
}

/// Helper function to create a test book and return its ID
async fn create_test_book(title_val: &str, publisher_id_val: i32) -> i32 {
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
    repo.add(new_book)
        .await
        .expect("Failed to create test book");
    let books = repo.get_all().await.expect("Failed to get books").unwrap();
    books.iter().find(|b| b.title == title_val).unwrap().book_id
}

#[tokio::test]
#[serial_test::serial]
async fn test_create_book_author_link() {
    setup().await.expect("Failed to set up test");
    let author_id = create_test_author("Test Author").await;
    let publisher_id = create_test_publisher("Test Publisher").await;
    let book_id = create_test_book("Test Book", publisher_id).await;

    let repo = BookAuthorRepo::new().await;
    let new_link = BookAuthors { book_id, author_id };
    let result = repo.add(new_link).await;
    assert!(result.is_ok());

    let links = repo.get_all().await.expect("Failed to get links").unwrap();
    assert_eq!(links.len(), 1);
    assert_eq!(links[0].book_id, book_id);
    assert_eq!(links[0].author_id, author_id);
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_authors_by_book() {
    setup().await.expect("Failed to set up test");
    let author_id1 = create_test_author("Author 1").await;
    let author_id2 = create_test_author("Author 2").await;
    let publisher_id = create_test_publisher("Test Publisher").await;
    let book_id = create_test_book("Test Book", publisher_id).await;

    let repo = BookAuthorRepo::new().await;
    repo.add(BookAuthors {
        book_id,
        author_id: author_id1,
    })
    .await
    .unwrap();
    repo.add(BookAuthors {
        book_id,
        author_id: author_id2,
    })
    .await
    .unwrap();

    let authors = repo.get_authors_by_book(book_id).await.unwrap().unwrap();
    assert_eq!(authors.len(), 2);
    assert!(authors.iter().any(|a| a.author_id == author_id1));
    assert!(authors.iter().any(|a| a.author_id == author_id2));
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_books_by_author() {
    setup().await.expect("Failed to set up test");
    let author_id = create_test_author("Test Author").await;
    let publisher_id = create_test_publisher("Test Publisher").await;
    let book_id1 = create_test_book("Book 1", publisher_id).await;
    let book_id2 = create_test_book("Book 2", publisher_id).await;

    let repo = BookAuthorRepo::new().await;
    repo.add(BookAuthors {
        book_id: book_id1,
        author_id,
    })
    .await
    .unwrap();
    repo.add(BookAuthors {
        book_id: book_id2,
        author_id,
    })
    .await
    .unwrap();

    let books = repo.get_books_by_author(author_id).await.unwrap().unwrap();
    assert_eq!(books.len(), 2);
    assert!(books.iter().any(|b| b.book_id == book_id1));
    assert!(books.iter().any(|b| b.book_id == book_id2));
}

#[tokio::test]
#[serial_test::serial]
async fn test_delete_book_author_link() {
    setup().await.expect("Failed to set up test");
    let author_id = create_test_author("Test Author").await;
    let publisher_id = create_test_publisher("Test Publisher").await;
    let book_id = create_test_book("Test Book", publisher_id).await;

    let repo = BookAuthorRepo::new().await;
    let new_link = BookAuthors { book_id, author_id };
    repo.add(new_link).await.unwrap();

    let result = repo.delete((book_id, author_id)).await;
    assert!(result.is_ok());

    let link = repo.get_by_id((book_id, author_id)).await.unwrap();
    assert!(link.is_none());
}
