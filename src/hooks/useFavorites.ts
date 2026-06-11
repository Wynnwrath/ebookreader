import { useState, useEffect, useCallback } from "react";

/**
 * Manages the user's favorite books via localStorage.
 * Replaces duplicated favorites logic in BookPage, BookDetailPage, and LibraryPage.
 */
export function useFavorites(userId: number | null) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!userId) return;
    const saved = localStorage.getItem(`stellaron-favorites-${userId}`);
    if (saved) {
      try {
        setFavorites(new Set<number>(JSON.parse(saved)));
      } catch {
        setFavorites(new Set());
      }
    }
  }, [userId]);

  const isFavorite = useCallback(
    (bookId: number) => favorites.has(bookId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (bookId: number) => {
      if (!userId) return;
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(bookId)) {
          next.delete(bookId);
        } else {
          next.add(bookId);
        }
        localStorage.setItem(
          `stellaron-favorites-${userId}`,
          JSON.stringify(Array.from(next))
        );
        return next;
      });
    },
    [userId]
  );

  return { favorites, isFavorite, toggleFavorite };
}
