import { invoke } from "@tauri-apps/api/core";

// Helper: Convert Blob to Base64 String (for saving to LocalStorage)
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper: Convert Base64 DataURI to Uint8Array (Synchronous)
const base64ToUint8Array = (dataURI) => {
  const base64 = dataURI.split(',')[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * ✅ NEW: INSTANTLY get the cover URL from cache if available.
 * Use this in useState initialization to avoid flickering.
 */
export function getCoverURLSync(bookId) {
  if (!bookId) return null;
  const cacheKey = `book_cover_${bookId}`;
  
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      // Convert base64 -> Blob -> URL synchronously
      const bytes = base64ToUint8Array(cachedData);
      const blob = new Blob([bytes], { type: "image/png" });
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.error("Sync cache retrieval failed:", err);
  }
  return null;
}

/**
 * Async fetcher. Checks cache first, then Backend.
 * Saves to cache if fetched from backend.
 */
export async function fetchCoverPage(bookId) {
  if (!bookId) return "";

  // 1. Try Sync Cache first
  const cachedUrl = getCoverURLSync(bookId);
  if (cachedUrl) return cachedUrl;

  // 2. Fetch from Backend
  try {
    const byteArray = await invoke("get_cover_img", { bookId: Number(bookId) });
    if (!byteArray || byteArray.length === 0) return "";

    const uint8Array = new Uint8Array(byteArray);
    const blob = new Blob([uint8Array], { type: "image/png" });

    // 3. Save to LocalStorage (catch quota errors if full)
    try {
      const base64Data = await blobToBase64(blob);
      const cacheKey = `book_cover_${bookId}`;
      localStorage.setItem(cacheKey, base64Data);
    } catch (storageErr) {
      console.warn("LocalStorage full, skipping cache for book:", bookId);
    }

    return URL.createObjectURL(blob);

  } catch (err) {
    console.error("Failed to fetch cover image:", err);
    return "";
  }
}