use diesel::result::Error;
use diesel_async::RunQueryDsl;

use stellaron_lib::data::database;
use stellaron_lib::data::models::users::NewUser;
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

/// Helper function to create a test user
async fn create_test_user(
    username_val: &str,
    email_val: &str,
    password_val: &str,
    role_val: Option<&str>,
) -> Result<(), Error> {
    let repo = UserRepo::new().await;
    let new_user = NewUser {
        username: username_val,
        email: email_val,
        password_hash: password_val,
        role: role_val,
    };

    repo.add(new_user).await
}

#[tokio::test]
#[serial_test::serial]
async fn test_create_user() {
    setup().await.expect("Failed to set up test");

    let username = "testuser";
    let email = "test@example.com";
    let password = "hashedpassword123";
    let role = "admin";

    let result = create_test_user(username, email, password, Some(role)).await;
    assert!(result.is_ok());

    let repo = UserRepo::new().await;
    let users = repo.get_all().await.expect("Failed to get users");

    assert!(users.is_some());
    let users_vec = users.unwrap();
    assert_eq!(users_vec.len(), 1);
    assert_eq!(users_vec[0].username, username);
    assert_eq!(users_vec[0].email, email);
    assert_eq!(users_vec[0].password_hash, password);
    assert_eq!(users_vec[0].role, Some(role.to_string()));
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_all_users_empty() {
    setup().await.expect("Failed to set up test");

    let repo = UserRepo::new().await;
    let users = repo.get_all().await.expect("Failed to get users");

    assert!(users.is_none());
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_user_by_id() {
    setup().await.expect("Failed to set up test");

    let username = "testuser";
    let email = "test@example.com";
    let password = "hashedpassword123";

    create_test_user(username, email, password, None)
        .await
        .expect("Failed to create test user");

    let repo = UserRepo::new().await;
    let users = repo.get_all().await.expect("Failed to get users").unwrap();
    let user_id = users[0].user_id;

    let user = repo
        .get_by_id(user_id)
        .await
        .expect("Failed to get user by id");

    assert!(user.is_some());
    let found_user = user.unwrap();
    assert_eq!(found_user.username, username);
    assert_eq!(found_user.email, email);
    assert_eq!(found_user.role, Some("admin".to_string()));
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_user_by_id_nonexistent() {
    setup().await.expect("Failed to set up test");

    let repo = UserRepo::new().await;
    let user = repo
        .get_by_id(999)
        .await
        .expect("Failed to execute get_user_by_id");

    assert!(user.is_none());
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_user_by_username() {
    setup().await.expect("Failed to set up test");

    let username = "uniqueuser";
    let email = "unique@example.com";
    let password = "uniquepass123";
    let role = "user";

    create_test_user(username, email, password, Some(role))
        .await
        .expect("Failed to create test user");

    let repo = UserRepo::new().await;
    let users = repo
        .search_by_username(username)
        .await
        .expect("Failed to get user by username");

    assert!(users.is_some());
    let found_users = users.unwrap();
    assert_eq!(found_users.len(), 1);
    let found_user = &found_users[0];
    assert_eq!(found_user.username, username);
    assert_eq!(found_user.email, email);
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_user_by_username_nonexistent() {
    setup().await.expect("Failed to set up test");

    let repo = UserRepo::new().await;
    let users = repo
        .search_by_username("nonexistentuser")
        .await
        .expect("Failed to execute get_user_by_username");

    print!("Users: {:?}", users);

    assert!(users.is_none());
}

#[tokio::test]
#[serial_test::serial]
async fn test_get_all_users_multiple() {
    setup().await.expect("Failed to set up test");

    let usernames = ["user1", "user2", "user3"];
    let emails = [
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
    ];
    let passwords = ["pass1", "pass2", "pass3"];
    let roles = ["user", "admin", "user"];

    for i in 0..3 {
        create_test_user(usernames[i], emails[i], passwords[i], Some(roles[i]))
            .await
            .expect("Failed to create test user");
    }

    let repo = UserRepo::new().await;
    let users = repo.get_all().await.expect("Failed to get users");

    assert!(users.is_some());
    let users_vec = users.unwrap();
    assert_eq!(users_vec.len(), 3);

    for i in 0..3 {
        let user = users_vec.iter().find(|u| u.username == usernames[i]);
        assert!(user.is_some());
        let user = user.unwrap();
        assert_eq!(user.email, emails[i]);
        assert_eq!(user.password_hash, passwords[i]);
    }
}

#[tokio::test]
#[serial_test::serial]
async fn test_search_by_username_exact() {
    setup().await.expect("Failed to set up test");

    let username = "exactuser";
    let email = "exact@example.com";
    let password = "exactpass123";
    let role = "user";

    create_test_user(username, email, password, Some(role))
        .await
        .expect("Failed to create test user");

    let repo = UserRepo::new().await;
    let user = repo
        .search_by_username_exact(username)
        .await
        .expect("Failed to search by exact username");

    assert!(user.is_some());
    let found_user = user.unwrap();
    assert_eq!(found_user.username, username);
    assert_eq!(found_user.email, email);
    assert_eq!(found_user.password_hash, password);
    assert_eq!(found_user.role, Some(role.to_string()));
}

#[tokio::test]
#[serial_test::serial]
async fn test_search_by_username_exact_nonexistent() {
    setup().await.expect("Failed to set up test");

    let repo = UserRepo::new().await;
    let user = repo
        .search_by_username_exact("nonexistentuser")
        .await
        .expect("Failed to execute search_by_username_exact");

    assert!(user.is_none());
}

#[tokio::test]
#[serial_test::serial]
async fn test_search_by_username_exact_partial_match_fails() {
    setup().await.expect("Failed to set up test");

    let username = "fullname";
    let email = "full@example.com";
    let password = "fullpass123";

    create_test_user(username, email, password, None)
        .await
        .expect("Failed to create test user");

    let repo = UserRepo::new().await;

    // Searching for partial username should return None (exact match only)
    let user = repo
        .search_by_username_exact("full")
        .await
        .expect("Failed to execute search_by_username_exact");

    assert!(user.is_none());
}
