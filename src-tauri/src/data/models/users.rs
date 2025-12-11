use crate::data::models::schema::*;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Queryable, Identifiable, Selectable, Deserialize, Serialize, PartialEq, Debug)]
#[diesel(table_name = users)]
#[diesel(primary_key(user_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Users {
    pub user_id: i32,
    pub username: String,
    pub email: Option<String>,
    pub role: Option<String>,
    pub password_hash: String,
    pub created_at: Option<String>,
    pub refresh_token: Option<String>,
}

#[derive(Insertable, PartialEq, Debug)]
#[diesel(table_name = users)]
pub struct NewUser<'a> {
    pub username: &'a str,
    pub email: Option<&'a str>,
    pub role: Option<&'a str>,
    pub password_hash: &'a str,
}

#[derive(AsChangeset, PartialEq, Debug)]
#[diesel(table_name = users)]
pub struct UpdateUser<'a> {
    pub username: Option<&'a str>,
    pub email: Option<&'a str>,
    pub role: Option<&'a str>,
    pub password_hash: Option<&'a str>,
    pub refresh_token: Option<&'a str>,
}
