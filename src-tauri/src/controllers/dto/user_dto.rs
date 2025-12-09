use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserDTO {
    pub username: String,
    pub email: Option<String>,
    pub role: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewUserDTO {
    pub username: String,
    pub email: Option<String>,
    pub password: String,
    pub role: Option<String>,
    pub created_at: Option<String>,
}
