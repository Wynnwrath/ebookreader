# Backend Integration Guide

This guide highlights where backend developers will most likely integrate APIs or Tauri commands within the React frontend.

## Authentication
- **File:** `src/pages/LoginPage.jsx`
- **Current behavior:** Hard-coded credentials (`admin` / `admin123`) and client-side navigation on success.
- **Integration notes:** Replace the static check with a login API call (or Tauri command), handle errors, and store auth tokens/session info. Wire the Register/Forgot Password links to backend flows.

## Quotes
- **File:** `src/components/QuoteGenerator.jsx`
- **Current behavior:** Fetches quotes from `https://quotes-api-self.vercel.app/quote` and caches them in `localStorage`.
- **Integration notes:** Point this fetch to your backend (or proxy). Decide how to cache/refresh quotes and handle offline/error states.

## Home/Library Feeds
- **Files:**
  - `src/components/Bookdata/Library.jsx`
  - `src/components/ContinueRead.jsx`
- **Current behavior:** Book lists (continue reading, recently added, favorites) are hard-coded arrays.
- **Integration notes:** Replace static arrays with backend data. Add loading/error handling, pagination, and filtering as needed.

## Book Detail
- **File:** `src/pages/BookPage.jsx`
- **Current behavior:** Loads book data from router `location.state` or a static `fallbackBook` object.
- **Integration notes:** Fetch book details (by `id`), related books, file URLs, and reading progress from the backend. Use the `id` route param and surface errors/empty states.

## Library Organization
- **File:** `src/pages/LibraryPage.jsx`
- **Current behavior:** Folder creation/expansion lives only in React state.
- **Integration notes:** Back these operations with backend storage. Provide endpoints or Tauri commands to create/import folders, persist contents, and sync expansion state.

## Suggested API Wrapper
Create a small API client (e.g., `src/services/api.js`) for common fetch/command helpers (auth headers, error normalization). Wire the above files to that client to keep components focused on UI.