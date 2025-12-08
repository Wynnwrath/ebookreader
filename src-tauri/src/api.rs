use crate::controllers::{
    annotation_controller, auth_controller, book_controller, bookmark_controller,
    reading_progress_controller, search_controller, user_controller,
};
use axum::routing::{delete, get, post, put};
use axum::Router;
use std::net::SocketAddr;
use tokio::net::TcpListener;

pub fn start() {
    // TODO: Add Swagger documentation
    // TODO: Test all routes
    let api: Router<()> = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .route("/register", post(user_controller::create_user))
        .route("/list_users", get(user_controller::list_users))
        .route("/user", get(user_controller::get_user))
        .route("/login", post(auth_controller::login))
        .route("/refresh", post(auth_controller::refresh))
        .route("/logout", post(auth_controller::logout))
        .route("/book/{id}/content", get(book_controller::get_book_content))
        .route("/bookmarks", post(bookmark_controller::create_bookmark))
        .route("/bookmarks", get(bookmark_controller::get_bookmarks))
        .route(
            "/bookmarks/{id}",
            delete(bookmark_controller::delete_bookmark),
        )
        .route(
            "/annotations",
            post(annotation_controller::create_annotation),
        )
        .route("/annotations", get(annotation_controller::get_annotations))
        .route(
            "/annotations/{id}",
            put(annotation_controller::update_annotation),
        )
        .route(
            "/annotations/{id}",
            delete(annotation_controller::delete_annotation),
        )
        .route(
            "/progress",
            post(reading_progress_controller::update_progress),
        )
        .route("/progress", get(reading_progress_controller::get_progress))
        .route(
            "/progress/all",
            get(reading_progress_controller::get_all_progress),
        )
        .route("/search/books", get(search_controller::search_books))
        .route("/search/authors", get(search_controller::search_authors))
        .route("/books", get(search_controller::list_all_books))
        .with_state(());

    tokio::spawn(async move {
        let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

        println!("Starting server on {}", addr);

        match axum::serve(
            TcpListener::bind(addr)
                .await
                .expect("Failed to bind on address"),
            api,
        )
        .await
        {
            Ok(_) => (),
            Err(e) => eprintln!("Error starting server: {}", e),
        }
    });
}
