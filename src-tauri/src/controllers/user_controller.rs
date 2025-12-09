use axum::{
    body::Body,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};

use crate::{
    controllers::{auth_middleware::AuthUser, dto::user_dto::*},
    data::repos::implementors::user_repo::UserRepo,
};
use crate::{
    data::repos::traits::repository::Repository,
    services::authentication_service::AuthenticationService,
};
// TODO: Test this endpoint
/// Endpoint to register a new user (/register)
/// Password is hashed using Argon2 before storing in the database
pub async fn create_user(Json(user): Json<NewUserDTO>) -> impl IntoResponse {
    let auth = AuthenticationService::new();
    let repo = UserRepo::new().await;

    use crate::data::models::users::NewUser;
    let hashed_password = match auth.hash_password(&user.password) {
        Ok(h) => h,
        Err(e) => {
            eprintln!("Error hashing password: {}", e);
            return Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Body::from("Failed to process password"))
                .unwrap();
        }
    };

    let new_user = NewUser {
        username: &user.username,
        email: user.email.as_deref(),
        role: user.role.as_deref(),
        password_hash: &hashed_password,
    };

    match repo.add(new_user).await {
        Ok(_) => (),
        Err(e) => {
            eprintln!("Error creating user: {}", e);
            return Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Body::from("Failed to create user"))
                .unwrap();
        }
    }

    Response::builder()
        .status(StatusCode::CREATED)
        .body(Body::from("User created"))
        .unwrap()
}

/// List all users - for testing purposes
pub async fn list_users() -> Json<Vec<UserDTO>> {
    let repo = UserRepo::new().await;
    let users = match repo.get_all().await {
        Ok(Some(user_list)) => user_list
            .into_iter()
            .map(|u| UserDTO {
                username: u.username,
                email: u.email,
                role: u.role,
                created_at: u.created_at,
            })
            .collect(),
        Ok(None) => vec![],
        Err(e) => {
            eprintln!("Error fetching users: {}", e);
            vec![]
        }
    };

    return Json(users);
}
/// For testing purposes, get user by id via query param
pub async fn get_user(user: AuthUser) -> impl IntoResponse {
    let repo = UserRepo::new().await;
    return match repo.get_by_id(user.id).await {
        Ok(Some(user)) => {
            let user_response = UserDTO {
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            };
            Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_string(&user_response).unwrap()))
                .unwrap()
        }
        Ok(None) => Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header("Content-Type", "application/json")
            .body(Body::from(r#"{"error":"User not found"}"#))
            .unwrap(),
        Err(e) => {
            eprintln!("Error fetching user: {}", e);
            Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .header("Content-Type", "application/json")
                .body(Body::from(r#"{"error":"Failed to fetch user"}"#))
                .unwrap()
        }
    };
}
