//TODO: Move mappers (From and Into) here
use crate::controllers::dto::user_dto::{NewUserDTO, UserDTO};
use crate::data::models::users::Users;

impl From<NewUserDTO> for UserDTO {
    fn from(user: NewUserDTO) -> Self {
        UserDTO {
            username: user.username.to_string(),
            email: user.email,
            created_at: user.created_at.map(|s| s.to_string()),
            role: user.role.map(|s| s.to_string()),
        }
    }
}

impl From<Users> for UserDTO {
    fn from(user: Users) -> Self {
        UserDTO {
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            role: user.role,
        }
    }
}
