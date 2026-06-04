/// An author of a book.
#[derive(Debug, Clone)]
pub struct Author {
    /// Auto-generated primary key.
    pub id: i32,
    /// Author's full name as extracted from ebook metadata.
    pub name: String,
}
