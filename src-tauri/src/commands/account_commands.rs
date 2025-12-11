use crate::data::models::users::Users;

/// Command to get account information by username.
/// Returns user details if found, otherwise returns an error message.
/// # Arguments
/// * `username` - A string slice that holds the username of the account to fetch.
/// # Returns
/// * `Result<Users, String>` - On success, returns the user details; on failure, returns an error message.
/// Refer to `Users` struct in `data::models::users` for user details structure.
#[tauri::command]
pub async fn get_account_info(username: &str) -> Result<Users, String> {
    // Placeholder implementation
    let repo = crate::data::repos::implementors::user_repo::UserRepo::new().await;
    let user = repo
        .search_by_username_exact(username)
        .await
        .map_err(|e| e.to_string())?;

    match user {
        Some(u) => Ok(u),
        None => Err("User not found".to_string()),
    }
}
