// src/services/apiClient.js
// Shared HTTP helpers so backend teams can swap base URLs or auth in one place.

// Normalize the API base URL (if provided) and expose it for conditional UI flows.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")
  : "";

/**
 * Lightweight wrapper around fetch that prefixes the API base URL and
 * applies consistent JSON handling. Backend teams can add auth headers,
 * interceptors, or logging here without touching page-level components.
 *
 * @param {string} path - Endpoint path beginning with a leading slash.
 * @param {RequestInit} [options] - Fetch options (method, headers, body, etc.).
 * @returns {Promise<any>} Parsed JSON response.
 */
export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error(
      "No API base URL configured. Set VITE_API_BASE_URL to call the backend."
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message || `Request failed: ${response.statusText}`);
  }

  // Many endpoints will return JSON; adjust here if you add file downloads.
  return response.status === 204 ? null : response.json();
}

async function extractErrorMessage(response) {
  try {
    const data = await response.json();
    return data?.message;
  } catch (err) {
    return null;
  }
}