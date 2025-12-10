CREATE TABLE annotations (
    annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    chapter_title TEXT,
    start_position TEXT NOT NULL,
    end_position TEXT NOT NULL,
    highlighted_text TEXT,
    note TEXT,
    color TEXT DEFAULT '#FFFF00',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user_library(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES user_library(book_id) ON DELETE CASCADE
);

CREATE INDEX idx_annotations_user_book ON annotations(user_id, book_id);

