use std::{
    env,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
};

use diesel::SqliteConnection;
use diesel_async::{
    SimpleAsyncConnection,
    pooled_connection::{
        AsyncDieselConnectionManager,
        deadpool::{Hook, HookError, Object, Pool, PoolError},
    },
    sync_connection_wrapper::SyncConnectionWrapper,
};
use dotenvy::dotenv;
use once_cell::sync::Lazy;
use tokio::sync::Mutex;

/// Type alias for the deadpool-backed async SQLite connection pool.
pub type DbPool = Pool<SyncConnectionWrapper<SqliteConnection>>;

/// Acquires a connection from the global pool.
///
/// # Returns
///
/// A pooled connection object ready for Diesel queries.
///
/// # Errors
///
/// Returns [`PoolError`] when the pool has been shut down or all connections
/// are exhausted.
pub async fn connect_from_pool()
-> Result<Object<SyncConnectionWrapper<SqliteConnection>>, PoolError> {
    DB_POOL.get().await
}

/// Creates a new deadpool connection pool for the given SQLite database URL.
///
/// A `post_create` hook sets SQLite pragmas (`foreign_keys`, WAL mode,
/// `synchronous = NORMAL`, `mmap_size`) on the first connection created.
///
/// # Arguments
///
/// * `database_url` - Path or `sqlite://` URI to the SQLite database file.
///
/// # Panics
///
/// Panics if the pool cannot be built (e.g., invalid configuration).
pub fn create_pool(database_url: &str) -> DbPool {
    let config =
        AsyncDieselConnectionManager::<SyncConnectionWrapper<SqliteConnection>>::new(database_url);

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
                        if result.is_ok() {
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
}

/// Global connection pool, initialized lazily from the `DATABASE_URL` env var.
static DB_POOL: Lazy<DbPool> = Lazy::new(|| {
    dotenv().ok();
    let database_path = env::var("DATABASE_URL").unwrap_or_else(|_| "./database.db".to_string());
    create_pool(&database_path)
});

/// Whether SQLite pragmas have already been set on at least one connection.
static PRAGMAS_SET: AtomicBool = AtomicBool::new(false);

/// Returns a clone of the global write lock.
///
/// Callers must hold this lock while performing write operations to prevent
/// SQLite's "database is locked" errors.
pub fn lock_db() -> Arc<Mutex<()>> {
    DB_LOCK.clone()
}

/// Global mutex guarding all SQLite write operations.
static DB_LOCK: Lazy<Arc<Mutex<()>>> = Lazy::new(|| Arc::new(Mutex::new(())));
