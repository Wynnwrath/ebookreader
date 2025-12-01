-- Your SQL goes here
CREATE TABLE `books` (
    `book_id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    `title` TEXT NOT NULL,
    `published_date` TEXT,
    `publisher_id` INTEGER,
    `isbn` TEXT,
    `file_type` TEXT,
    `file_path` TEXT,
    `cover_image_path` TEXT,
    `checksum` TEXT,
    `added_at` TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (`publisher_id`) REFERENCES `publishers`(`publisher_id`) ON DELETE SET NULL
);
