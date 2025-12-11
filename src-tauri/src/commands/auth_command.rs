use crate::data::repos::implementors::user_repo::UserRepo;
use crate::data::repos::traits::repository::Repository;
use crate::services::authentication_service::AuthenticationService;
/// Command to log in a user with username and password.
/// Returns true if authentication is successful, false otherwise.
/// Errors are returned as strings.
#[tauri::command]
pub async fn login(username: &str, password: &str) -> Result<bool, String> {
    let auth = AuthenticationService::new();

    auth.authenticate_user(username, password)
        .await
        .map_err(|e| e.to_string())
}
/// Command to register a new user with username and password.
/// Returns true if registration is successful. Errors are returned as strings.
#[tauri::command]
pub async fn register(username: &str, password: &str) -> Result<bool, String> {
    let auth = AuthenticationService::new();

    let repo = UserRepo::new().await;

    let hashed_password = auth
        .hash_password_async(password)
        .await
        .map_err(|e| e.to_string())?;
    if repo
        .search_by_username_exact(username)
        .await
        .map_err(|e| e.to_string())?
        .is_some()
    {
        Err("Username already exists".to_string())?
    } else {
        let new_user = crate::data::models::users::NewUser {
            username,
            password_hash: &hashed_password,
            email: None,
            role: None,
        };
        repo.add(new_user).await.map_err(|e| e.to_string())?;
        Ok(true)
    }
}
