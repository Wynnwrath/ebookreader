import { useState, useCallback } from "react";
import { tauriService } from "../services/tauriService";
import { Book, ProgressItem } from "../types";
import { formatLastRead, calculateStreak } from "../utils/formatters";

interface UseBooksWithProgressReturn {
  books: Book[];
  loading: boolean;
  streakDays: number;
  loadData: (silent?: boolean) => Promise<void>;
}

/**
 * Fetches all books with their reading progress merged.
 * Returns books sorted by most recently read, plus streak calculation.
 * Replaces the duplicated loadData pattern in HomePage, CollectionsPage, and LibraryPage.
 */
export function useBooksWithProgress(userId: number | null): UseBooksWithProgressReturn {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [streakDays, setStreakDays] = useState<number>(0);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const allBooks = await tauriService.listBooks();

      const progressPromises = allBooks.map(async (b) => {
        try {
          const p = await tauriService.getReadingProgress({ bookId: b.id });
          return p;
        } catch {
          return null;
        }
      });
      const progressResults = await Promise.all(progressPromises);
      const allProgress = progressResults.filter((p): p is ProgressItem => p !== null);

      const progressMap: Record<number, ProgressItem> = {};
      allProgress.forEach((p) => {
        progressMap[p.book_id] = p;
      });

      const booksWithProgress: Book[] = allBooks.map((b) => {
        const prog = progressMap[b.id];
        return {
          id: b.id,
          title: b.title,
          author: b.author || "Unknown Author",
          progress: prog ? Math.round(prog.progress_percentage || 0) : 0,
          lastReadAt: prog ? prog.last_read_at : null,
          lastRead: prog ? formatLastRead(prog.last_read_at) : "Never read",
        };
      });

      // Sort: books with recent progress first
      const sorted = [...booksWithProgress].sort((a, b) => {
        const aTime = a.lastReadAt ? new Date(a.lastReadAt.replace(" ", "T")).getTime() : 0;
        const bTime = b.lastReadAt ? new Date(b.lastReadAt.replace(" ", "T")).getTime() : 0;
        if (aTime && bTime) return bTime - aTime;
        if (aTime) return -1;
        if (bTime) return 1;
        return a.title.localeCompare(b.title);
      });

      setBooks(sorted);
      setStreakDays(calculateStreak(allProgress));
    } catch (err) {
      console.error("Failed to load books with progress:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { books, loading, streakDays, loadData };
}
