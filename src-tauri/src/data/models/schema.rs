// @generated automatically by Diesel CLI.

diesel::table! {
    annotations (annotation_id) {
        annotation_id -> Nullable<Integer>,
        user_id -> Integer,
        book_id -> Integer,
        chapter_title -> Nullable<Text>,
        start_position -> Text,
        end_position -> Text,
        highlighted_text -> Nullable<Text>,
        note -> Nullable<Text>,
        color -> Nullable<Text>,
        created_at -> Nullable<Text>,
        updated_at -> Nullable<Text>,
    }
}

diesel::table! {
    authors (author_id) {
        author_id -> Integer,
        name -> Text,
    }
}

diesel::table! {
    book_authors (book_id, author_id) {
        book_id -> Integer,
        author_id -> Integer,
    }
}

diesel::table! {
    bookmarks (bookmark_id) {
        bookmark_id -> Nullable<Integer>,
        user_id -> Integer,
        book_id -> Integer,
        chapter_title -> Nullable<Text>,
        page_number -> Nullable<Integer>,
        position -> Text,
        created_at -> Nullable<Text>,
    }
}

diesel::table! {
    books (book_id) {
        book_id -> Integer,
        title -> Text,
        published_date -> Nullable<Text>,
        publisher_id -> Nullable<Integer>,
        isbn -> Nullable<Text>,
        file_type -> Nullable<Text>,
        file_path -> Nullable<Text>,
        cover_image_path -> Nullable<Text>,
        checksum -> Nullable<Text>,
        added_at -> Nullable<Text>,
    }
}

diesel::table! {
    libraries (library_id) {
        library_id -> Integer,
        name -> Text,
        path -> Text,
        added_by -> Nullable<Integer>,
        added_at -> Nullable<Text>,
    }
}

diesel::table! {
    publishers (publisher_id) {
        publisher_id -> Integer,
        name -> Text,
    }
}

diesel::table! {
    reading_progress (progress_id) {
        progress_id -> Nullable<Integer>,
        user_id -> Integer,
        book_id -> Integer,
        current_position -> Text,
        chapter_title -> Nullable<Text>,
        page_number -> Nullable<Integer>,
        progress_percentage -> Nullable<Float>,
        last_read_at -> Nullable<Text>,
    }
}

diesel::table! {
    user_library (user_id, book_id) {
        user_id -> Integer,
        book_id -> Integer,
        added_at -> Nullable<Text>,
    }
}

diesel::table! {
    users (user_id) {
        user_id -> Integer,
        username -> Text,
        email -> Nullable<Text>,
        role -> Nullable<Text>,
        password_hash -> Text,
        created_at -> Nullable<Text>,
        refresh_token -> Nullable<Text>,
    }
}

diesel::joinable!(annotations -> books (book_id));
diesel::joinable!(annotations -> users (user_id));
diesel::joinable!(book_authors -> authors (author_id));
diesel::joinable!(book_authors -> books (book_id));
diesel::joinable!(bookmarks -> books (book_id));
diesel::joinable!(bookmarks -> users (user_id));
diesel::joinable!(books -> publishers (publisher_id));
diesel::joinable!(libraries -> users (added_by));
diesel::joinable!(reading_progress -> books (book_id));
diesel::joinable!(reading_progress -> users (user_id));
diesel::joinable!(user_library -> books (book_id));
diesel::joinable!(user_library -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    annotations,
    authors,
    book_authors,
    bookmarks,
    books,
    libraries,
    publishers,
    reading_progress,
    user_library,
    users,
);
