CREATE TABLE reading_progress (
    progress_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    current_position TEXT NOT NULL,
    chapter_title TEXT,
    page_number INTEGER,
    progress_percentage REAL DEFAULT 0.0,
    last_read_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user_library(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES user_library(book_id) ON DELETE CASCADE,
    UNIQUE(user_id, book_id)
);

CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX idx_reading_progress_book ON reading_progress(book_id);

