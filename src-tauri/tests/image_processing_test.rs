use stellaron_lib::handlers::epub_handler::get_epub_content;

#[tokio::test]
async fn test_image_processing_basic() {
    let path = "Fundamental-Accessibility-Tests-Basic-Functionality-v2.0.0.epub";
    let content = get_epub_content(path).await.expect("Failed to get content");
    
    if content.contains("<img") {
        println!("Found img tags in Basic test");
        let has_relative_paths = content.contains("src=\"Images/\"") || content.contains("src=\"images/\"");
        assert!(!has_relative_paths, "Found relative image paths in Basic test, expected data URIs");
        assert!(content.contains("data:image/"), "Should contain data URIs");
    }
}

#[tokio::test]
async fn test_image_processing_pg1513() {
    let path = "pg1513-images-3.epub";
    let content = get_epub_content(path).await.expect("Failed to get content");
    
    // Check for <image> tags which are SVG images
    if content.contains("<image") {
        println!("Found image tags in PG1513 test");
        
        // Check if we have data URIs
        assert!(content.contains("data:image/"), "Should contain data URIs for SVG images");

        // Verify that we don't have the original filename in href/ xlink:href as a relative path
        // The original was xlink:href="6874819369993830405_cover.jpg"
        assert!(!content.contains("href=\"6874819369993830405_cover.jpg\""), "Should have replaced the relative path");
    } else {
        panic!("Did not find <image> tags in PG1513, something is wrong with parsing or the file");
    }
}