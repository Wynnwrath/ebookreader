# Backend TODOS
- [ ] Integrate an AI agent used for explanations of terms/entries
- [ ] Add OPDS Catalog Support
- [ ] MOBI Support
# Known Issues
- [ ] **Backend:** Performance issues when reading big ebooks (preload in background/stream book)
- [x] Images Overflow to the bottom of paginated reader (fixed)
- [ ] **Frontend & Backend:** Slow loading of book information (Memoize ebook on frontend and store/feed book metadata from db for backend)
- [ ] **Frontend:** Create collection window/form is centered relative to the page and not of the application window causing it to be misaligned
- [ ] **Frontend:** Remove leftover mock book data (Five Fall Into Adventure)
- [ ] **Frontend:** When clicking an entry on Table of Contents inside the book (not the sidebar) it redirects to mock book (Five Fall Into Adventure)
- [ ] **Frontend:** When viewing collections have the delete button and close at the bottom requiring the user to scroll down.

# Improvements (UI/UX)
- [ ] When adding books it should not refresh the entire webpage.
- [ ] Remove mock synopsis data
- [ ] Ability to add books to libraries/collections by either right clicking a book or as an option within book entry in book details or as an ellipsis (...) in book cover next to delete book option (?)
- [ ] Redesign page when selecting a collection
- [ ] Pressing play should immediately read an ebook and not redirect to book info page
- [ ] Apply downscale filters for displayed covered images throughout the app except for the reader. 