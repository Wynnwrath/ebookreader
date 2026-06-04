use sha2::{Digest, Sha256};
use tokio::io::AsyncReadExt;

/// Computes the SHA-256 hex digest of a file.
///
/// Reads the file in 8 KB chunks to handle large files efficiently.
/// Used for duplicate detection during book import.
///
/// # Arguments
///
/// * `path` - Absolute path to the file to checksum.
///
/// # Returns
///
/// The lowercase hex-encoded SHA-256 digest as a `String`.
///
/// # Errors
///
/// Returns [`std::io::Error`] when the file cannot be opened or read.
pub async fn compute_checksum(path: &str) -> Result<String, std::io::Error> {
    let mut file = tokio::fs::File::open(path).await?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 8192];
    loop {
        let n = file.read(&mut buf).await?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}
