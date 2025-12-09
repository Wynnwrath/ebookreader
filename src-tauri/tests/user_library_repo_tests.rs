use diesel::result::Error;
use diesel_async::RunQueryDsl;

use stellaron_lib::data::database;
use stellaron_lib::data::models::books::NewBook;
use stellaron_lib::data::models::publishers::NewPublisher;
use stellaron_lib::data::models::user_library::NewUserLibrary;
use stellaron_lib::data::models::users::NewUser;
use stellaron_lib::data::repos::implementors::book_repo::BookRepo;
use stellaron_lib::data::repos::implementors::publisher_repo::PublisherRepo;
use stellaron_lib::data::repos::implementors::user_library_repo::UserLibraryRepo;
use stellaron_lib::data::repos::implementors::user_repo::UserRepo;
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

/// Helper function to create a test user and return its ID
async fn create_test_user(username_val: &str) -> i32 {
    let repo = UserRepo::new().await;
    let new_user = NewUser {
        username: username_val,
        email: Some(&format!("{}@test.com", username_val)),
        role: Some("user"),
        password_hash: "password",
    };
    repo.add(new_user)
        .await
        .expect("Failed to create test user");
    let users = repo.get_all().await.expect("Failed to get users").unwrap();
    users
        .iter()
        .find(|u| u.username == username_val)
        .unwrap()
        .user_id
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
async fn test_create_user_library_link() {
    setup().await.expect("Failed to set up test");
    let user_id = create_test_user("testuser").await;
    let publisher_id = create_test_publisher("Test Publisher").await;
    let book_id = create_test_book("Test Book", publisher_id).await;

    let repo = UserLibraryRepo::new().await;
    let new_link = NewUserLibrary { user_id, book_id };
    let result = repo.add(new_link).await;
    assert!(result.is_ok());

    let links = repo.get_all().await.expect("Failed to get links").unwrap();
    assert_eq!(links.len(), 1);
    assert_eq!(links[0].user_id, user_id);
    assert_eq!(links[0].book_id, book_id);
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_books_by_user() {
    setup().await.expect("Failed to set up test");
    let user_id = create_test_user("testuser").await;
    let publisher_id = create_test_publisher("Test Publisher").await;
    let book_id1 = create_test_book("Book 1", publisher_id).await;
    let book_id2 = create_test_book("Book 2", publisher_id).await;

    let repo = UserLibraryRepo::new().await;
    repo.add(NewUserLibrary {
        user_id,
        book_id: book_id1,
    })
    .await
    .unwrap();
    repo.add(NewUserLibrary {
        user_id,
        book_id: book_id2,
    })
    .await
    .unwrap();

    let books = repo.get_books_by_user(user_id).await.unwrap().unwrap();
    assert_eq!(books.len(), 2);
    assert!(books.iter().any(|b| b.book_id == book_id1));
    assert!(books.iter().any(|b| b.book_id == book_id2));
}

#[tokio::test]
#[serial_test::serial]
async fn test_delete_user_library_link() {
    setup().await.expect("Failed to set up test");
    let user_id = create_test_user("testuser").await;
    let publisher_id = create_test_publisher("Test Publisher").await;
    let book_id = create_test_book("Test Book", publisher_id).await;

    let repo = UserLibraryRepo::new().await;
    repo.add(NewUserLibrary { user_id, book_id }).await.unwrap();

    let result = repo.delete((user_id, book_id)).await;
    assert!(result.is_ok());

    let link = repo.get_by_id((user_id, book_id)).await.unwrap();
    assert!(link.is_none());
}
