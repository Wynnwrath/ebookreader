use crate::data::models::users::Users;

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