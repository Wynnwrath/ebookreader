CREATE TABLE bookmarks (
    bookmark_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    chapter_title TEXT,
    page_number INTEGER,
    position TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user_library(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES user_library(book_id) ON DELETE CASCADE
);

CREATE INDEX idx_bookmarks_user_book ON bookmarks(user_id, book_id);

