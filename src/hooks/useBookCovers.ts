import { useState, useEffect, useRef, useCallback } from "react";
import { tauriService } from "../services/tauriService";

/**
 * Manages fetching and caching book cover images as Blob URLs.
 * Handles URL.revokeObjectURL on unmount to prevent memory leaks.
 */
export function useBookCovers() {
  const [covers, setCovers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const blobUrlsRef = useRef<string[]>([]);

  // Revoke all blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch {}
      });
    };
  }, []);

  const loadCovers = useCallback(async (bookIds: number[]) => {
    // Only set loading to true if we actually have books to fetch covers for
    if (bookIds.length === 0) return;
    
    setLoading(true);
    const newCovers: Record<number, string> = {};
    
    try {
      await Promise.all(
        bookIds.map(async (bookId) => {
          try {
            const coverBytes = await tauriService.getCoverImg(bookId);
            if (coverBytes && coverBytes.length > 0) {
              const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
              const url = URL.createObjectURL(blob);
              newCovers[bookId] = url;
              blobUrlsRef.current.push(url);
            }
          } catch (e) {
            // Silently skip books without covers
          }
        })
      );
    } finally {
      setCovers((prev) => ({ ...prev, ...newCovers }));
      setLoading(false);
    }
  }, []);

  const loadSingleCover = useCallback(async (bookId: number): Promise<string | null> => {
    setLoading(true);
    try {
      const coverBytes = await tauriService.getCoverImg(bookId);
      if (coverBytes && coverBytes.length > 0) {
        const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        blobUrlsRef.current.push(url);
        setCovers((prev) => ({ ...prev, [bookId]: url }));
        return url;
      }
    } catch {
      // Silently skip
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  return { covers, loading, loadCovers, loadSingleCover };
}
