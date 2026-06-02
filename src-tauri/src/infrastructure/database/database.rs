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

pub type DbPool = Pool<SyncConnectionWrapper<SqliteConnection>>;

pub async fn connect_from_pool()
-> Result<Object<SyncConnectionWrapper<SqliteConnection>>, PoolError> {
    DB_POOL.get().await
}

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

static DB_POOL: Lazy<DbPool> = Lazy::new(|| {
    dotenv().ok();
    let database_path = env::var("DATABASE_URL").unwrap_or_else(|_| "./database.db".to_string());
    create_pool(&database_path)
});

static PRAGMAS_SET: AtomicBool = AtomicBool::new(false);

pub fn lock_db() -> Arc<Mutex<()>> {
    DB_LOCK.clone()
}

static DB_LOCK: Lazy<Arc<Mutex<()>>> = Lazy::new(|| Arc::new(Mutex::new(())));
