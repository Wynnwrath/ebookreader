use crate::{
    data::repos::implementors::user_repo::UserRepo,
    services::{authentication_service::AuthenticationService, token_service},
};
use axum::{http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};

use super::dto::login_dto::LoginDTO;

#[derive(Deserialize)]
pub struct RefreshTokenDTO {
    pub refresh_token: String,
}

#[derive(Serialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: String,
}

pub async fn login(Json(payload): Json<LoginDTO>) -> impl IntoResponse {
    let user_repo = UserRepo::new().await;
    let auth_service = AuthenticationService::new();
    // TODO: Refactor
    match user_repo.search_by_username(&payload.username).await {
        Ok(Some(mut users)) => {
            if let Some(user) = users.pop() {
                // TODO: Make sure username matches only one user
                match auth_service.verify_password(&payload.password, &user.password_hash) {
                    Ok(true) => {
                        let tokenizer = token_service::Tokenizer::get_instance().await;
                        match tokenizer.generate_token(user.user_id) {
                            Ok(access_token) => {
                                let refresh_token = tokenizer.generate_refresh_token();
                                // Store refresh token in database
                                if let Err(_) = user_repo
                                    .update_refresh_token(user.user_id, &refresh_token)
                                    .await
                                {
                                    return (
                                        StatusCode::INTERNAL_SERVER_ERROR,
                                        "Failed to store refresh token",
                                    )
                                        .into_response();
                                }

                                (
                                    StatusCode::OK,
                                    Json(TokenResponse {
                                        access_token,
                                        refresh_token,
                                    }),
                                )
                                    .into_response()
                            }
                            Err(_) => (
                                StatusCode::INTERNAL_SERVER_ERROR,
                                "Failed to generate token",
                            )
                                .into_response(),
                        }
                    }
                    Ok(false) => (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response(),
                    Err(_) => (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "Password verification failed",
                    )
                        .into_response(),
                }
            } else {
                (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response()
            }
        }
        Ok(None) => (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn refresh(Json(payload): Json<RefreshTokenDTO>) -> impl IntoResponse {
    let user_repo = UserRepo::new().await;

    match user_repo.get_by_refresh_token(&payload.refresh_token).await {
        Ok(Some(user)) => {
            let tokenizer = token_service::Tokenizer::get_instance().await;
            match tokenizer.generate_token(user.user_id) {
                Ok(access_token) => (
                    StatusCode::OK,
                    Json(TokenResponse {
                        access_token,
                        refresh_token: payload.refresh_token,
                    }),
                )
                    .into_response(),
                Err(_) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to generate token",
                )
                    .into_response(),
            }
        }
        Ok(None) => (StatusCode::UNAUTHORIZED, "Invalid refresh token").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}

pub async fn logout(Json(payload): Json<RefreshTokenDTO>) -> impl IntoResponse {
    let user_repo = UserRepo::new().await;

    // Find user by refresh token and clear it
    match user_repo.get_by_refresh_token(&payload.refresh_token).await {
        Ok(Some(user)) => {
            if let Err(_) = user_repo.update_refresh_token(user.user_id, "").await {
                return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to logout").into_response();
            }
            (StatusCode::OK, "Logged out successfully").into_response()
        }
        Ok(None) => (StatusCode::UNAUTHORIZED, "Invalid refresh token").into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response(),
    }
}
