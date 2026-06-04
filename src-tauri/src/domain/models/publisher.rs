/// A book publisher.
#[derive(Debug, Clone)]
pub struct Publisher {
    /// Auto-generated primary key.
    pub id: i32,
    /// Publisher's name as extracted from ebook metadata.
    pub name: String,
}
