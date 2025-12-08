// src/api/fetchBook.js (or wherever this lives)
import { apiRequest, API_BASE_URL } from "./apiClient";

const fallbackBook = {
  id: "demo-book",
  title: "The Lost World",
  author: "Arthur Conan Doyle",
  rating: 4,
  tags: ["Adventure", "Science Fiction", "Classic"],
  coverImage: "https://m.media-amazon.com/images/I/81Bdms8XQxL.jpg",
  filePath: "/books/the-lost-world.epub",
  type: "EPUB",
  size: "1.8 MB",

  // ✅ Total pages are used by:
  // - BookDetails
  // - ReaderModal
  // - BookProgress / BookCard
  pages: 320,

  // ✅ currentPage is used for:
  // - Restoring where the user left off
  // - Showing progress bars across the UI
  currentPage: 0, // backend should update this as the user reads

  language: "English",
  publishedYear: 1912,
  synopsis:
    "Deep in the uncharted Amazon jungle, an eccentric professor claims to have discovered a plateau where prehistoric creatures still roam. Accompanied by a skeptical journalist and a small expedition team, he returns to prove his unbelievable story. Their daring journey quickly turns into a fight for survival as they encounter dinosaurs, primitive tribes, and dangers beyond imagination.",
  authorBio:
    "Sir Arthur Conan Doyle (1859–1930) was a British writer best known for creating the detective Sherlock Holmes. Beyond mysteries, he wrote historical novels, science fiction, plays, and poetry. 'The Lost World' is one of his most influential adventure stories, inspiring countless adaptations and modern dinosaur tales.",
  relatedBooks: [
    {
      id: "journey-to-the-center-of-the-earth",
      title: "Journey to the Center of the Earth",
      author: "Jules Verne",
      rating: 4,
      tags: ["Adventure", "Science Fiction"],
      coverImage: "https://m.media-amazon.com/images/I/81n7FMmHtPL._SL1500_.jpg",
      type: "EPUB",
      filePath: "/books/journey-to-the-center.epub",
    },
    {
      id: "twenty-thousand-leagues",
      title: "Twenty Thousand Leagues Under the Sea",
      author: "Jules Verne",
      rating: 5,
      tags: ["Adventure", "Classic"],
      coverImage: "https://m.media-amazon.com/images/I/81l3rZK4lnL._SL1500_.jpg",
      type: "PDF",
      filePath: "/books/20000-leagues.pdf",
    },
    {
      id: "time-machine",
      title: "The Time Machine",
      author: "H. G. Wells",
      rating: 4,
      tags: ["Science Fiction", "Classic"],
      coverImage: "https://m.media-amazon.com/images/I/71oM2FfF2hL._SL1360_.jpg",
      type: "MOBI",
      filePath: "/books/time-machine.mobi",
    },
  ],
};

/**
 * Fetch a single book by ID from the backend.
 * Backend teams can stub or swap this implementation without touching the UI components.
 *
 * Expected response shape (frontend relies on these fields):
 * {
 *   id: string,
 *   title: string,
 *   author: string,
 *   rating?: number,
 *   tags?: string[],
 *   coverImage?: string,
 *   type?: string,
 *   size?: string,
 *   pages?: number,        // total pages (used for reader + progress)
 *   currentPage?: number,  // last read page (used for progress / resume)
 *   language?: string,
 *   publishedYear?: number,
 *   synopsis?: string,
 *   authorBio?: string,
 *   relatedBooks?: Array<{
 *     id: string,
 *     title: string,
 *     author: string,
 *     coverImage?: string,
 *     type?: string,
 *     filePath?: string,
 *   }>
 * }
 */
export async function fetchBook(id, { fallback = true } = {}) {
  if (API_BASE_URL) {
    // Single place that calls the backend; swap this path to match your API.
    return apiRequest(`/books/${encodeURIComponent(id)}`);
  }

  // When no backend is wired up yet, always return sample data so designers can iterate.
  if (!fallback) {
    console.warn(
      "No API base URL configured for book lookup. Returning sample data instead."
    );
  }

  // Keep everything else from the fallback, but override id
  return { ...fallbackBook, id };
}

export { API_BASE_URL };
