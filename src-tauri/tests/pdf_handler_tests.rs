use stellaron_lib::infrastructure::file_handlers::pdf_handler::*;

fn fixture_path(name: &str) -> String {
    format!(
        "{}/tests/fixtures/{}",
        env!("CARGO_MANIFEST_DIR"),
        name
    )
}

#[tokio::test]
async fn test_parse_pdf_meta() {
    let path = fixture_path("test.pdf");
    let result = parse_pdf_meta(path).await;
    assert!(
        result.is_ok(),
        "Failed to parse PDF metadata: {:?}",
        result.err()
    );
    let metadata = result.unwrap();
    assert!(!metadata.title.is_empty(), "Title should not be empty");
    assert!(
        !metadata.checksum.is_empty(),
        "Checksum should not be empty"
    );
    assert_eq!(
        metadata.checksum.len(),
        64,
        "SHA-256 checksum should be 64 hex characters"
    );
}

#[tokio::test]
async fn test_get_pdf_cover() {
    let path = fixture_path("test.pdf");
    let result = get_pdf_cover(&path).await;
    assert!(
        result.is_ok(),
        "Failed to get PDF cover: {:?}",
        result.err()
    );
    let cover = result.unwrap();
    assert!(!cover.is_empty(), "Cover image should not be empty");
}

#[tokio::test]
async fn test_get_pdf_page_count() {
    let path = fixture_path("test.pdf");
    let result = get_pdf_page_count(&path).await;
    assert!(
        result.is_ok(),
        "Failed to get PDF page count: {:?}",
        result.err()
    );
    assert_eq!(result.unwrap(), 1, "Should have 1 page");
}

#[tokio::test]
async fn test_read_pdf_page() {
    let path = fixture_path("test.pdf");
    let result = read_pdf_page(&path, 0).await;
    assert!(
        result.is_ok(),
        "Failed to read PDF page: {:?}",
        result.err()
    );
    let page = result.unwrap();
    assert_eq!(page.page_number, 0, "First page should be numbered 0");
    assert!(!page.image_data.is_empty(), "Page image should not be empty");
    assert!(page.width > 0, "Page width should be positive");
    assert!(page.height > 0, "Page height should be positive");
}

#[tokio::test]
async fn test_scan_pdfs() {
    let result = scan_pdfs(".").await;
    assert!(result.is_ok(), "Failed to scan PDFs: {:?}", result.err());
    let paths = result.unwrap();
    assert!(
        paths
            .iter()
            .any(|p| p.extension().map(|e| e == "pdf").unwrap_or(false)),
        "Should find at least one PDF file"
    );
}

#[tokio::test]
async fn test_parse_pdf_meta_nonexistent() {
    let result = parse_pdf_meta("nonexistent.pdf".to_string()).await;
    assert!(result.is_err(), "Should fail for nonexistent file");
}

#[tokio::test]
async fn test_get_pdf_cover_nonexistent() {
    let result = get_pdf_cover("nonexistent.pdf").await;
    assert!(result.is_err(), "Should fail for nonexistent file");
}

#[tokio::test]
async fn test_read_pdf_page_nonexistent() {
    let result = read_pdf_page("nonexistent.pdf", 0).await;
    assert!(result.is_err(), "Should fail for nonexistent file");
}

#[tokio::test]
async fn test_read_pdf_page_out_of_range() {
    let path = fixture_path("test.pdf");
    let result = read_pdf_page(&path, 999).await;
    assert!(result.is_err(), "Should fail for out-of-range page");
}

#[tokio::test]
async fn test_pdf_text_spans() {
    let path = fixture_path("test.pdf");
    let result = read_pdf_page(&path, 0).await;
    assert!(
        result.is_ok(),
        "Failed to read PDF page: {:?}",
        result.err()
    );
    let page = result.unwrap();
    assert!(
        !page.text_spans.is_empty(),
        "Should have text spans from the test PDF"
    );

    let combined_text: String = page.text_spans.iter().map(|s| s.text.as_str()).collect();
    assert!(
        combined_text.contains("Test"),
        "Text spans should contain 'Test', got: {}",
        combined_text
    );
}
