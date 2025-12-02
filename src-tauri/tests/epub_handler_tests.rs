use stellaron_lib::handlers::epub_handler::*;

#[tokio::test]
async fn test_get_epub_content() {
    let path = "Fundamental-Accessibility-Tests-Basic-Functionality-v2.0.0.epub";
    let result = get_epub_content(path).await;
    assert!(
        result.is_ok(),
        "Failed to get epub content: {:?}",
        result.err()
    );
    let content = result.unwrap();
    assert!(!content.is_empty(), "Content should not be empty");
}

#[tokio::test]
async fn test_parse_epub_meta() {
    let path = "Fundamental-Accessibility-Tests-Basic-Functionality-v2.0.0.epub".to_string();
    let result = parse_epub_meta(path).await;
    assert!(
        result.is_ok(),
        "Failed to parse epub metadata: {:?}",
        result.err()
    );
    let metadata = result.unwrap();
    assert!(!metadata.title.is_empty(), "Title should not be empty");
    assert!(
        !metadata.checksum.is_empty(),
        "Checksum should not be empty"
    );
}

#[tokio::test]
async fn test_scan_epubs() {
    let result = scan_epubs(".").await;
    assert!(result.is_ok(), "Failed to scan epubs: {:?}", result.err());
    let paths = result.unwrap();
    assert!(
        paths
            .iter()
            .any(|p| p.extension().map(|e| e == "epub").unwrap_or(false)),
        "Should find at least one epub file"
    );
}

#[tokio::test]
async fn test_compute_checksum() {
    let path = "Fundamental-Accessibility-Tests-Basic-Functionality-v2.0.0.epub";
    let result = compute_checksum(path).await;
    assert!(
        result.is_ok(),
        "Failed to compute checksum: {:?}",
        result.err()
    );
    let checksum = result.unwrap();
    assert_eq!(
        checksum.len(),
        64,
        "SHA-256 checksum should be 64 hex characters"
    );
}
