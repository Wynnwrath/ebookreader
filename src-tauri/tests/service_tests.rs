use diesel::result::Error;
use diesel_async::RunQueryDsl;

use stellaron_lib::data::database;
use stellaron_lib::data::models::books::NewBook;
use stellaron_lib::data::models::publishers::NewPublisher;
use stellaron_lib::data::models::users::NewUser;
use stellaron_lib::data::repos::implementors::book_repo::BookRepo;
use stellaron_lib::data::repos::implementors::publisher_repo::PublisherRepo;
use stellaron_lib::data::repos::implementors::user_repo::UserRepo;
use stellaron_lib::data::repos::traits::repository::Repository;
use stellaron_lib::handlers::epub_handler::{
    compute_checksum, extract_fonts_to_disk, get_epub_content, parse_epub_meta, scan_epubs,
    store_cover_to_disk, store_metadata_to_disk,
};
use stellaron_lib::services::book_service::{
    add_annotation, add_book_from_metadata, add_bookmark, book_exists_by_checksum,
    delete_annotation, delete_bookmark, extract_book_html_content, get_annotations, get_bookmarks,
    update_annotation,
};

const TEST_EPUB_PATH: &str = "Fundamental-Accessibility-Tests-Basic-Functionality-v2.0.0.epub";

/// Helper function to clear the tables before each test
async fn setup() -> Result<(), Error> {
    let mut conn = database::connect_from_pool()
        .await
        .expect("Failed to get connection from pool for test setup");

    use stellaron_lib::data::models::schema::annotations::dsl::*;
    use stellaron_lib::data::models::schema::authors::dsl::*;
    use stellaron_lib::data::models::schema::book_authors::dsl::*;
    use stellaron_lib::data::models::schema::bookmarks::dsl::*;
    use stellaron_lib::data::models::schema::books::dsl::*;
    use stellaron_lib::data::models::schema::publishers::dsl::*;
    use stellaron_lib::data::models::schema::reading_progress::dsl::*;
    use stellaron_lib::data::models::schema::user_library::dsl::*;
    use stellaron_lib::data::models::schema::users::dsl::*;

    diesel::delete(annotations).execute(&mut conn).await?;
    diesel::delete(bookmarks).execute(&mut conn).await?;
    diesel::delete(reading_progress).execute(&mut conn).await?;
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

/// Helper function to create a test user and return its ID
async fn create_test_user(username_val: &str) -> i32 {
    let repo = UserRepo::new().await;
    let new_user = NewUser {
        username: username_val,
        email: Some(&format!("{}@test.com", username_val)),
        password_hash: "test_hash",
        role: Some("user"),
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

/// Helper function to create a test book and return its ID
async fn create_test_book_with_path(title_val: &str, file_path_val: &str) -> i32 {
    let repo = BookRepo::new().await;
    let publisher_id = create_test_publisher("Test Publisher").await;
    let new_book = NewBook {
        title: title_val,
        publisher_id: Some(publisher_id),
        published_date: None,
        isbn: None,
        file_type: Some("epub"),
        file_path: Some(file_path_val),
        cover_image_path: None,
        checksum: None,
    };
    repo.add(new_book)
        .await
        .expect("Failed to create test book");
    let books = repo.get_all().await.expect("Failed to get books").unwrap();
    books.iter().find(|b| b.title == title_val).unwrap().book_id
}

// ======================= epub_handler tests =======================

#[tokio::test]
async fn test_scan_epubs_finds_test_file() {
    let result = scan_epubs(".").await;
    assert!(result.is_ok(), "Failed to scan epubs: {:?}", result.err());
    let paths = result.unwrap();
    assert!(
        paths.iter().any(|p| p
            .file_name()
            .map(|f| f.to_str().unwrap_or(""))
            .unwrap_or("")
            == "Fundamental-Accessibility-Tests-Basic-Functionality-v2.0.0.epub"),
        "Should find the test epub file"
    );
}

#[tokio::test]
async fn test_parse_epub_meta_extracts_metadata() {
    let result = parse_epub_meta(TEST_EPUB_PATH.to_string()).await;
    assert!(
        result.is_ok(),
        "Failed to parse epub metadata: {:?}",
        result.err()
    );

    let metadata = result.unwrap();
    assert!(!metadata.title.is_empty(), "Title should not be empty");
    assert!(!metadata.authors.is_empty(), "Authors should not be empty");
    assert!(
        !metadata.checksum.is_empty(),
        "Checksum should not be empty"
    );
    assert_eq!(
        metadata.file_path, TEST_EPUB_PATH,
        "File path should match input"
    );
}

#[tokio::test]
async fn test_get_epub_content_extracts_html() {
    let result = get_epub_content(TEST_EPUB_PATH).await;
    assert!(
        result.is_ok(),
        "Failed to get epub content: {:?}",
        result.err()
    );

    let content = result.unwrap();
    assert!(!content.is_empty(), "Content should not be empty");
    // EPUB content should contain some HTML elements
    assert!(
        content.contains("<") && content.contains(">"),
        "Content should contain HTML tags"
    );
}

#[tokio::test]
async fn test_compute_checksum_returns_valid_hash() {
    let result = compute_checksum(TEST_EPUB_PATH).await;
    assert!(
        result.is_ok(),
        "Failed to compute checksum: {:?}",
        result.err()
    );

    let checksum = result.unwrap();
    assert_eq!(
        checksum.len(),
        64,
        "SHA-256 checksum should be 64 hex characters"
    );
    // Verify checksum is deterministic
    let result2 = compute_checksum(TEST_EPUB_PATH).await.unwrap();
    assert_eq!(checksum, result2, "Checksum should be deterministic");
}

#[tokio::test]
async fn test_store_metadata_to_disk() {
    let metadata = parse_epub_meta(TEST_EPUB_PATH.to_string())
        .await
        .expect("Failed to parse epub");

    let result = store_metadata_to_disk(&metadata).await;
    assert!(
        result.is_ok(),
        "Failed to store metadata: {:?}",
        result.err()
    );

    let json_path = result.unwrap();
    assert!(json_path.ends_with(".json"), "Should create a JSON file");

    // Verify the file was created and clean up
    let path = std::path::Path::new(&json_path);
    assert!(path.exists(), "JSON file should exist");

    // Clean up
    let _ = tokio::fs::remove_file(&json_path).await;
}

#[tokio::test]
async fn test_store_cover_to_disk() {
    let metadata = parse_epub_meta(TEST_EPUB_PATH.to_string())
        .await
        .expect("Failed to parse epub");

    if let Some((cover_data, mime_type)) = &metadata.cover_data {
        let result = store_cover_to_disk(cover_data, mime_type, &metadata.title).await;
        assert!(result.is_ok(), "Failed to store cover: {:?}", result.err());

        let cover_path = result.unwrap();
        let path = std::path::Path::new(&cover_path);
        assert!(path.exists(), "Cover file should exist");

        // Clean up
        let _ = tokio::fs::remove_file(&cover_path).await;
    }
}

#[tokio::test]
async fn test_extract_fonts_to_disk() {
    let output_dir = "test_fonts_output";
    let result = extract_fonts_to_disk(TEST_EPUB_PATH, output_dir).await;
    assert!(
        result.is_ok(),
        "Failed to extract fonts: {:?}",
        result.err()
    );

    // Clean up test directory
    let _ = tokio::fs::remove_dir_all(output_dir).await;
}

// ======================= book_service tests =======================

#[tokio::test]
#[serial_test::serial]
async fn test_add_book_from_metadata() {
    setup().await.expect("Failed to set up test");

    let metadata = parse_epub_meta(TEST_EPUB_PATH.to_string())
        .await
        .expect("Failed to parse epub");

    let result = add_book_from_metadata(&metadata, None).await;
    assert!(
        result.is_ok(),
        "Failed to add book from metadata: {:?}",
        result.err()
    );

    // Verify the book was added
    let repo = BookRepo::new().await;
    let books = repo.get_all().await.expect("Failed to get books").unwrap();
    assert_eq!(books.len(), 1);
    assert_eq!(books[0].title, metadata.title);
}

#[tokio::test]
#[serial_test::serial]
async fn test_add_book_from_metadata_duplicate_checksum_fails() {
    setup().await.expect("Failed to set up test");

    let metadata = parse_epub_meta(TEST_EPUB_PATH.to_string())
        .await
        .expect("Failed to parse epub");

    // Add the book first time
    add_book_from_metadata(&metadata, None)
        .await
        .expect("First add should succeed");

    // Try to add the same book again
    let result = add_book_from_metadata(&metadata, None).await;
    assert!(result.is_err(), "Duplicate book should fail");
}

#[tokio::test]
#[serial_test::serial]
async fn test_book_exists_by_checksum() {
    setup().await.expect("Failed to set up test");

    let metadata = parse_epub_meta(TEST_EPUB_PATH.to_string())
        .await
        .expect("Failed to parse epub");

    // Book shouldn't exist yet
    let exists_before = book_exists_by_checksum(&metadata.checksum)
        .await
        .expect("Failed to check existence");
    assert!(!exists_before, "Book should not exist before adding");

    // Add the book
    add_book_from_metadata(&metadata, None)
        .await
        .expect("Failed to add book");

    // Now it should exist
    let exists_after = book_exists_by_checksum(&metadata.checksum)
        .await
        .expect("Failed to check existence");
    assert!(exists_after, "Book should exist after adding");
}

#[tokio::test]
#[serial_test::serial]
async fn test_extract_book_html_content() {
    setup().await.expect("Failed to set up test");

    let book_id = create_test_book_with_path("Test Book", TEST_EPUB_PATH).await;

    let result = extract_book_html_content(book_id).await;
    assert!(
        result.is_ok(),
        "Failed to extract HTML content: {:?}",
        result.err()
    );

    let content = result.unwrap();
    assert!(!content.is_empty(), "Content should not be empty");
}

#[tokio::test]
#[serial_test::serial]
async fn test_extract_book_html_content_nonexistent_book() {
    setup().await.expect("Failed to set up test");

    let result = extract_book_html_content(99999).await;
    assert!(result.is_err(), "Should fail for nonexistent book");
}

// ======================= bookmark service tests =======================

#[tokio::test]
#[serial_test::serial]
async fn test_add_and_get_bookmark() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("bookmark_user").await;
    let book_id = create_test_book_with_path("Bookmark Test Book", TEST_EPUB_PATH).await;

    // Add a bookmark
    let result = add_bookmark(
        user_id,
        book_id,
        "chapter1:100",
        Some("Chapter 1"),
        Some(10),
    )
    .await;
    assert!(result.is_ok(), "Failed to add bookmark: {:?}", result.err());

    // Retrieve the bookmark
    let bookmarks = get_bookmarks(user_id, book_id)
        .await
        .expect("Failed to get bookmarks");
    assert!(bookmarks.is_some(), "Should have bookmarks");

    let bookmarks_vec = bookmarks.unwrap();
    assert_eq!(bookmarks_vec.len(), 1);
    assert_eq!(bookmarks_vec[0].position, "chapter1:100");
    assert_eq!(
        bookmarks_vec[0].chapter_title,
        Some("Chapter 1".to_string())
    );
    assert_eq!(bookmarks_vec[0].page_number, Some(10));
}

#[tokio::test]
#[serial_test::serial]
async fn test_add_multiple_bookmarks() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("multi_bookmark_user").await;
    let book_id = create_test_book_with_path("Multi Bookmark Book", TEST_EPUB_PATH).await;

    // Add multiple bookmarks
    add_bookmark(user_id, book_id, "pos1", Some("Chapter 1"), Some(1))
        .await
        .expect("Failed to add first bookmark");
    add_bookmark(user_id, book_id, "pos2", Some("Chapter 2"), Some(20))
        .await
        .expect("Failed to add second bookmark");
    add_bookmark(user_id, book_id, "pos3", None, None)
        .await
        .expect("Failed to add third bookmark");

    let bookmarks = get_bookmarks(user_id, book_id)
        .await
        .expect("Failed to get bookmarks")
        .unwrap();
    assert_eq!(bookmarks.len(), 3);
}

#[tokio::test]
#[serial_test::serial]
async fn test_delete_bookmark() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("delete_bookmark_user").await;
    let book_id = create_test_book_with_path("Delete Bookmark Book", TEST_EPUB_PATH).await;

    // Add a bookmark
    add_bookmark(user_id, book_id, "to_delete", None, None)
        .await
        .expect("Failed to add bookmark");

    let bookmarks = get_bookmarks(user_id, book_id)
        .await
        .expect("Failed to get bookmarks")
        .unwrap();
    let bookmark_id = bookmarks[0].bookmark_id.unwrap();

    // Delete the bookmark
    let result = delete_bookmark(bookmark_id).await;
    assert!(
        result.is_ok(),
        "Failed to delete bookmark: {:?}",
        result.err()
    );

    // Verify it's gone
    let bookmarks_after = get_bookmarks(user_id, book_id)
        .await
        .expect("Failed to get bookmarks");
    assert!(
        bookmarks_after.is_none(),
        "Bookmarks should be empty after deletion"
    );
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_bookmarks_empty() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("empty_bookmark_user").await;
    let book_id = create_test_book_with_path("Empty Bookmark Book", TEST_EPUB_PATH).await;

    let bookmarks = get_bookmarks(user_id, book_id)
        .await
        .expect("Failed to get bookmarks");
    assert!(bookmarks.is_none(), "Should have no bookmarks");
}

// ======================= annotation service tests =======================

#[tokio::test]
#[serial_test::serial]
async fn test_add_and_get_annotation() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("annotation_user").await;
    let book_id = create_test_book_with_path("Annotation Test Book", TEST_EPUB_PATH).await;

    // Add an annotation
    let result = add_annotation(
        user_id,
        book_id,
        "start:100",
        "end:150",
        Some("Chapter 1"),
        Some("This is highlighted text"),
        Some("My note about this passage"),
        Some("#ffff00"),
    )
    .await;
    assert!(
        result.is_ok(),
        "Failed to add annotation: {:?}",
        result.err()
    );

    // Retrieve the annotation
    let annotations = get_annotations(user_id, book_id)
        .await
        .expect("Failed to get annotations");
    assert!(annotations.is_some(), "Should have annotations");

    let annotations_vec = annotations.unwrap();
    assert_eq!(annotations_vec.len(), 1);
    assert_eq!(annotations_vec[0].start_position, "start:100");
    assert_eq!(annotations_vec[0].end_position, "end:150");
    assert_eq!(
        annotations_vec[0].chapter_title,
        Some("Chapter 1".to_string())
    );
    assert_eq!(
        annotations_vec[0].highlighted_text,
        Some("This is highlighted text".to_string())
    );
    assert_eq!(
        annotations_vec[0].note,
        Some("My note about this passage".to_string())
    );
    assert_eq!(annotations_vec[0].color, Some("#ffff00".to_string()));
}

#[tokio::test]
#[serial_test::serial]
async fn test_add_annotation_minimal() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("minimal_annotation_user").await;
    let book_id = create_test_book_with_path("Minimal Annotation Book", TEST_EPUB_PATH).await;

    // Add an annotation with only required fields
    let result = add_annotation(
        user_id, book_id, "start:0", "end:10", None, None, None, None,
    )
    .await;
    assert!(
        result.is_ok(),
        "Failed to add minimal annotation: {:?}",
        result.err()
    );

    let annotations = get_annotations(user_id, book_id)
        .await
        .expect("Failed to get annotations")
        .unwrap();
    assert_eq!(annotations.len(), 1);
    assert_eq!(annotations[0].start_position, "start:0");
    assert_eq!(annotations[0].end_position, "end:10");
}

#[tokio::test]
#[serial_test::serial]
async fn test_update_annotation() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("update_annotation_user").await;
    let book_id = create_test_book_with_path("Update Annotation Book", TEST_EPUB_PATH).await;

    // Add an annotation
    add_annotation(
        user_id,
        book_id,
        "start:0",
        "end:10",
        None,
        Some("Original text"),
        Some("Original note"),
        Some("#ff0000"),
    )
    .await
    .expect("Failed to add annotation");

    let annotations = get_annotations(user_id, book_id)
        .await
        .expect("Failed to get annotations")
        .unwrap();
    let annotation_id = annotations[0].annotation_id.unwrap();

    // Update the annotation
    let result = update_annotation(
        annotation_id,
        Some("Updated Chapter"),
        None,
        None,
        Some("Updated text"),
        Some("Updated note"),
        Some("#00ff00"),
    )
    .await;
    assert!(
        result.is_ok(),
        "Failed to update annotation: {:?}",
        result.err()
    );

    // Verify the update
    let updated_annotations = get_annotations(user_id, book_id)
        .await
        .expect("Failed to get annotations")
        .unwrap();
    assert_eq!(
        updated_annotations[0].chapter_title,
        Some("Updated Chapter".to_string())
    );
    assert_eq!(
        updated_annotations[0].highlighted_text,
        Some("Updated text".to_string())
    );
    assert_eq!(
        updated_annotations[0].note,
        Some("Updated note".to_string())
    );
    assert_eq!(updated_annotations[0].color, Some("#00ff00".to_string()));
}

#[tokio::test]
#[serial_test::serial]
async fn test_delete_annotation() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("delete_annotation_user").await;
    let book_id = create_test_book_with_path("Delete Annotation Book", TEST_EPUB_PATH).await;

    // Add an annotation
    add_annotation(
        user_id, book_id, "start:0", "end:10", None, None, None, None,
    )
    .await
    .expect("Failed to add annotation");

    let annotations = get_annotations(user_id, book_id)
        .await
        .expect("Failed to get annotations")
        .unwrap();
    let annotation_id = annotations[0].annotation_id.unwrap();

    // Delete the annotation
    let result = delete_annotation(annotation_id).await;
    assert!(
        result.is_ok(),
        "Failed to delete annotation: {:?}",
        result.err()
    );

    // Verify it's gone
    let annotations_after = get_annotations(user_id, book_id)
        .await
        .expect("Failed to get annotations");
    assert!(
        annotations_after.is_none(),
        "Annotations should be empty after deletion"
    );
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_annotations_empty() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("empty_annotation_user").await;
    let book_id = create_test_book_with_path("Empty Annotation Book", TEST_EPUB_PATH).await;

    let annotations = get_annotations(user_id, book_id)
        .await
        .expect("Failed to get annotations");
    assert!(annotations.is_none(), "Should have no annotations");
}

#[tokio::test]
#[serial_test::serial]
async fn test_multiple_annotations_same_book() {
    setup().await.expect("Failed to set up test");

    let user_id = create_test_user("multi_annotation_user").await;
    let book_id = create_test_book_with_path("Multi Annotation Book", TEST_EPUB_PATH).await;

    // Add multiple annotations
    for i in 0..5 {
        add_annotation(
            user_id,
            book_id,
            &format!("start:{}", i * 100),
            &format!("end:{}", i * 100 + 50),
            Some(&format!("Chapter {}", i + 1)),
            Some(&format!("Text {}", i)),
            Some(&format!("Note {}", i)),
            None,
        )
        .await
        .expect(&format!("Failed to add annotation {}", i));
    }

    let annotations = get_annotations(user_id, book_id)
        .await
        .expect("Failed to get annotations")
        .unwrap();
    assert_eq!(annotations.len(), 5);
}
