use chrono::{Duration, Utc};
use dotenvy::dotenv;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::env;
use tokio::task;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32,   // Subject (user_id)
    pub exp: usize, // Expiration time
}

pub struct Tokenizer {
    pub secret_key: String,
    pub expiration_duration: i64,
}

impl Tokenizer {
    pub async fn get_instance() -> &'static Tokenizer {
        &TOKENIZER
    }
    // TODO: Test this function
    pub fn generate_token(&self, user_id: i32) -> Result<String, jsonwebtoken::errors::Error> {
        let expiration = Utc::now()
            .checked_add_signed(Duration::seconds(self.expiration_duration))
            .expect("valid timestamp")
            .timestamp() as usize;

        let claims = Claims {
            sub: user_id,
            exp: expiration,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret_key.as_ref()),
        )
    }
    // TODO: Test this async function
    pub async fn generate_token_async(
        &self,
        user_id: i32,
    ) -> Result<String, jsonwebtoken::errors::Error> {
        let secret_key = self.secret_key.clone();
        let expiration_duration = self.expiration_duration;

        task::spawn_blocking(move || {
            let expiration = Utc::now()
                .checked_add_signed(Duration::seconds(expiration_duration))
                .expect("valid timestamp")
                .timestamp() as usize;

            let claims = Claims {
                sub: user_id,
                exp: expiration,
            };

            encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(secret_key.as_ref()),
            )
        })
        .await
        .unwrap() // Propagate panics from the spawned task
    }

    pub fn decode_token(&self, token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
        let mut validation = Validation::default();
        validation.validate_exp = true;
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret_key.as_ref()),
            &validation,
        )
        .map(|data| data.claims)
    }

    pub fn refresh_token(&self, user_id: i32) -> Result<String, jsonwebtoken::errors::Error> {
        // Generate a new access token for the user
        self.generate_token(user_id)
    }

    pub fn generate_refresh_token(&self) -> String {
        // Generate a random refresh token (UUID-based)
        use uuid::Uuid;
        Uuid::new_v4().to_string()
    }
}

static TOKENIZER: Lazy<Tokenizer> = Lazy::new(|| {
    dotenv().ok(); // Load .env file

    let secret_key = env::var("JWT_SECRET")
        .unwrap_or_else(|_| "a_very_secret_key_that_should_be_in_env".to_string());
    let expiration_duration = env::var("TOKEN_EXPIRATION_SECONDS")
        .unwrap_or_else(|_| "3600".to_string())
        .parse::<i64>()
        .unwrap_or(3600);

    Tokenizer {
        secret_key,
        expiration_duration,
    }
});
