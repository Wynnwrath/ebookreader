use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};

use argon2::password_hash::{self, rand_core::OsRng, SaltString};
use tokio::task;

pub struct AuthenticationService;

impl AuthenticationService {
    pub fn new() -> Self {
        AuthenticationService
    }
    pub fn hash_password(&self, password: &str) -> Result<String, password_hash::Error> {
        let argon2 = Argon2::default();

        let salt = SaltString::generate(&mut OsRng);
        match argon2.hash_password(password.as_bytes(), &salt) {
            Ok(hash) => Ok(hash.to_string()),
            Err(e) => Err(e),
        }
    }

    pub fn verify_password(
        &self,
        password: &str,
        hash: &str,
    ) -> Result<bool, password_hash::Error> {
        let parsed_hash = PasswordHash::new(hash)?;
        let argon2 = Argon2::default();

        match argon2.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(_) => Ok(true),
            Err(password_hash::Error::Password) => Ok(false),
            Err(e) => Err(e),
        }
    }

    pub fn hash_and_verify(&self, password: &str) -> Result<String, password_hash::Error> {
        let hash = self.hash_password(password)?;
        self.verify_password(password, &hash)?;
        Ok(hash)
    }

    pub async fn hash_password_async(&self, password: &str) -> Result<String, password_hash::Error> {
        let password = password.to_string();
        task::spawn_blocking(move || {
            let argon2 = Argon2::default();

            let salt = SaltString::generate(&mut OsRng);
            match argon2.hash_password(password.as_bytes(), &salt) {
                Ok(hash) => Ok(hash.to_string()),
                Err(e) => Err(e),
            }
        })
        .await
        .map_err(|_| password_hash::Error::Password)? // Propagate panics from the spawned task
    }

    pub async fn verify_password_async(
        &self,
        password: &str,
        hash: &str,
    ) -> Result<bool, password_hash::Error> {
        let password = password.to_string();
        let hash = hash.to_string();
        task::spawn_blocking(move || {
            let parsed_hash = PasswordHash::new(&hash)?;
            let argon2 = Argon2::default();

            match argon2.verify_password(password.as_bytes(), &parsed_hash) {
                Ok(_) => Ok(true),
                Err(password_hash::Error::Password) => Ok(false),
                Err(e) => Err(e),
            }
        })
        .await
        .map_err(|_| password_hash::Error::Password)? // Propagate panics from the spawned task
    }

    pub async fn hash_and_verify_async(&self, password: &str) -> Result<String, password_hash::Error> {
        let hashed = self.hash_password_async(password).await?;
        self.verify_password_async(password, &hashed).await?;
        Ok(hashed)
    }
}
