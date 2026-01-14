-- Your SQL goes here
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    `username` TEXT UNIQUE NOT NULL,
    `email` TEXT UNIQUE,
    `role` TEXT DEFAULT 'admin',
    `password_hash` TEXT NOT NULL,
    `created_at` TEXT DEFAULT (datetime('now'))
);