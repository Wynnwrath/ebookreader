use std::{
    env,
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
};

use diesel::SqliteConnection;
use diesel_async::{
    pooled_connection::{
        deadpool::{Hook, HookError, Object, Pool, PoolError},
        AsyncDieselConnectionManager,
    },
    sync_connection_wrapper::SyncConnectionWrapper,
    SimpleAsyncConnection,
};
use dotenvy::dotenv;
use once_cell::sync::Lazy;
use tokio::sync::Mutex;

pub fn get_db_path() -> String {
    if let Ok(url) = env::var("DATABASE_URL") {
        return url;
    }

    let base_dir = if cfg!(windows) {
        env::var("LOCALAPPDATA")
            .or_else(|_| env::var("APPDATA"))
            .unwrap_or_else(|_| ".".to_string())
    } else {
        env::var("HOME").unwrap_or_else(|_| ".".to_string())
    };

    let app_dir = Path::new(&base_dir).join("Stellaron");
    let _ = std::fs::create_dir_all(&app_dir);

    app_dir.join("database.db").to_string_lossy().to_string()
}

/// Returns a connection from the database connection pool
///
/// # Usage
///
/// ```rust,ignore
/// // Create a database connection
/// let conn = connect_from_pool().await;
/// // Handle errors(if any)
/// let mut conn = match conn {
///     Ok(value) => value,
///     Err(e) => panic!("Failed to connect from pool: {e}"),
/// };
/// // Use the connection
/// let res = books
///     .select(Books::as_select())
///     .load(&mut conn)
///     .await;
/// // Handle errors on results
/// let results = match res {
///     Ok(value) => value,
///     Err(e) => panic!("Failed to fetch results: {e}"),
/// };
/// ```
pub async fn connect_from_pool(
) -> Result<Object<SyncConnectionWrapper<SqliteConnection>>, PoolError> {
    return DB_POOL.get().await;
}
/// Lazily initializes a database connection pool
static DB_POOL: Lazy<Pool<SyncConnectionWrapper<SqliteConnection>>> = Lazy::new(|| {
    dotenv().ok();

    let database_path = get_db_path();
    let config =
        AsyncDieselConnectionManager::<SyncConnectionWrapper<SqliteConnection>>::new(database_path);

    Pool::builder(config)
        .post_create(Hook::async_fn(
            |conn: &mut SyncConnectionWrapper<SqliteConnection>, _meta| {
                Box::pin(async move {
                    if !PRAGMAS_SET.load(Ordering::Relaxed) {
                        let result = conn
                            .batch_execute(
                                "
                                PRAGMA foreign_keys = ON;
                                PRAGMA journal_mode = WAL;
                                PRAGMA synchronous = NORMAL;
                                PRAGMA mmap_size = 30000000000;
                            ",
                            )
                            .await;
                        if let Ok(_) = result {
                            PRAGMAS_SET.store(true, Ordering::Relaxed);
                        }

                        result.map_err(|e| {
                            HookError::Message(format!("Failed to set SQLite pragmas: {e}").into())
                        })
                    } else {
                        Ok(())
                    }
                })
            },
        ))
        .build()
        .expect("Failed to create SQLite connection pool")
});
// Indicates whether the SQLite pragmas have been set
static PRAGMAS_SET: AtomicBool = AtomicBool::new(false);

pub fn lock_db() -> Arc<Mutex<()>> {
    return DB_LOCK.clone();
}

static DB_LOCK: Lazy<Arc<Mutex<()>>> = Lazy::new(|| Arc::new(Mutex::new(())));
