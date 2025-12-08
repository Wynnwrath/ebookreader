// src/api/library.js (or wherever this lives)
import { apiRequest, API_BASE_URL } from "./apiClient";

const fallbackFolders = [
  {
    name: "Sample Imports",
    expanded: true,
    books: [
      {
        id: "sample-journey",
        title: "Journey to the Center of the Earth",
        author: "Jules Verne",
        coverImage:
          "https://m.media-amazon.com/images/I/81n7FMmHtPL._SL1500_.jpg",
        type: "EPUB",
        filePath: "/books/journey-to-the-center.epub",

        // EXTRA METADATA FOR UI (optional but used if present)
        rating: 4,
        tags: ["Adventure", "Science Fiction", "Classic"],

        // Used by BookCard / BookProgress / ReaderModal
        pages: 320,
        currentPage: 0, // backend should update this as user reads
      },
      {
        id: "sample-lost-world",
        title: "The Lost World",
        author: "Arthur Conan Doyle",
        coverImage: "https://m.media-amazon.com/images/I/81Bdms8XQxL.jpg",
        type: "PDF",
        filePath: "/books/the-lost-world.pdf",

        rating: 4,
        tags: ["Adventure", "Prehistoric", "Classic"],

        pages: 320,
        currentPage: 0,
      },
    ],
  },
];

/**
 * Retrieve folders and their books from the backend library endpoint.
 * Update this function to match backend contract without changing UI consumers.
 *
 * Expected response shape (used by Library / FolderList / FolderItem):
 * Array<{
 *   id?: string,
 *   name: string,
 *   expanded?: boolean,
 *   books?: Array<{
 *     id: string,
 *     title: string,
 *     author: string,
 *     coverImage?: string,
 *     type?: string,
 *     filePath?: string,
 *
 *     // OPTIONAL BUT USED IF PRESENT:
 *     rating?: number,
 *     tags?: string[],
 *     pages?: number,        // total pages
 *     currentPage?: number,  // last read page (for progress)
 *   }>
 * }>
 */
export async function fetchLibraryFolders() {
  if (API_BASE_URL) {
    // Single path to adjust if your backend uses a different route or query params.
    return apiRequest("/library");
  }

  return fallbackFolders;
}

/**
 * Persist a new folder to the backend library endpoint.
 * Only this function needs edits when wiring up backend behavior for folder creation.
 */
export async function saveFolder(folder) {
  if (API_BASE_URL) {
    return apiRequest("/library/folders", {
      method: "POST",
      body: JSON.stringify(folder),
    });
  }

  return {
    ...folder,
    id: folder.id ?? `local-${Date.now()}`,
  };
}

export { API_BASE_URL };
