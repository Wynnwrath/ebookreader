CREATE TABLE books (
    book_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title            TEXT NOT NULL,
    published_date   TEXT,
    publisher_id     INTEGER,
    isbn             TEXT,
    file_type        TEXT NOT NULL,
    file_path        TEXT NOT NULL,
    cover_image_path TEXT,
    checksum         TEXT,
    added_at         TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (publisher_id) REFERENCES publishers(publisher_id) ON DELETE SET NULL
);

CREATE TABLE authors (
    author_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL
);

CREATE TABLE publishers (
    publisher_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL
);

CREATE TABLE book_authors (
    book_id   INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    PRIMARY KEY (book_id, author_id),
    FOREIGN KEY (book_id)   REFERENCES books(book_id)      ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
);

CREATE TABLE bookmarks (
    bookmark_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id       INTEGER NOT NULL,
    chapter_title TEXT,
    page_number   INTEGER,
    position      TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);
CREATE INDEX idx_bookmarks_book ON bookmarks(book_id);

CREATE TABLE annotations (
    annotation_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id          INTEGER NOT NULL,
    chapter_title    TEXT,
    start_position   TEXT NOT NULL,
    end_position     TEXT NOT NULL,
    highlighted_text TEXT,
    note             TEXT,
    color            TEXT DEFAULT '#FFFF00',
    created_at       TEXT DEFAULT (datetime('now')),
    updated_at       TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);
CREATE INDEX idx_annotations_book ON annotations(book_id);

CREATE TABLE reading_progress (
    progress_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id             INTEGER NOT NULL UNIQUE,
    current_position    TEXT NOT NULL,
    chapter_title       TEXT,
    page_number         INTEGER,
    progress_percentage REAL DEFAULT 0.0,
    last_read_at        TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);
CREATE INDEX idx_reading_progress_book ON reading_progress(book_id);
