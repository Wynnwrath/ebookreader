import { useState, useCallback, MutableRefObject } from "react";
import { tauriService } from "../services/tauriService";
import { Bookmark, BookDetails } from "../types";

interface UseBookmarksOptions {
  readerRef: MutableRefObject<HTMLDivElement | null>;
  bookDetails: BookDetails | null;
  userId: number;
  layoutMode: "classic" | "redesign";
  currentPage: number;
  activeChapter: string;
}

/**
 * Manages bookmark CRUD operations for the reader.
 * Supports both PDF (page-number based) and EPUB (scroll-position based) bookmarks.
 */
export function useBookmarks({
  readerRef,
  bookDetails,
  userId,
  layoutMode,
  currentPage,
  activeChapter,
}: UseBookmarksOptions) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const loadBookmarks = useCallback(
    async (bookId: number) => {
      try {
        const bmarks = await tauriService.getBookmarks({ userId, bookId });
        setBookmarks(bmarks || []);
      } catch (e) {
        console.error("Failed to load bookmarks:", e);
        setBookmarks([]);
      }
    },
    [userId]
  );

  const toggleBookmark = useCallback(async () => {
    if (!bookDetails) return;

    if (bookDetails.file_type === "pdf") {
      const existing = bookmarks.find(
        (b) => parseInt(b.position, 10) === currentPage
      );
      try {
        if (existing) {
          await tauriService.deleteBookmark(existing.bookmark_id);
        } else {
          await tauriService.addBookmark({
            userId,
            bookId: bookDetails.id,
            position: String(currentPage),
            chapterTitle: `Page ${currentPage}`,
            pageNumber: currentPage,
          });
        }
        const bmarks = await tauriService.getBookmarks({
          userId,
          bookId: bookDetails.id,
        });
        setBookmarks(bmarks || []);
      } catch (e) {
        console.error("Failed to toggle PDF bookmark:", e);
      }
      return;
    }

    if (!readerRef.current) return;
    const container = readerRef.current;
    const scrollPos =
      layoutMode === "redesign" ? container.scrollLeft : container.scrollTop;
    const threshold = 150;
    const existing = bookmarks.find(
      (b) => Math.abs(parseFloat(b.position) - scrollPos) < threshold
    );

    try {
      if (existing) {
        await tauriService.deleteBookmark(existing.bookmark_id);
      } else {
        await tauriService.addBookmark({
          userId,
          bookId: bookDetails.id,
          position: String(scrollPos),
          chapterTitle: activeChapter,
          pageNumber: currentPage,
        });
      }
      const bmarks = await tauriService.getBookmarks({
        userId,
        bookId: bookDetails.id,
      });
      setBookmarks(bmarks || []);
    } catch (e) {
      console.error("Failed to toggle bookmark:", e);
    }
  }, [bookDetails, bookmarks, currentPage, activeChapter, userId, layoutMode, readerRef]);

  const isBookmarked = useCallback((): boolean => {
    if (bookDetails?.file_type === "pdf") {
      return bookmarks.some(
        (b) => parseInt(b.position, 10) === currentPage
      );
    }
    if (!readerRef.current) return false;
    const scrollPos =
      layoutMode === "redesign"
        ? readerRef.current.scrollLeft
        : readerRef.current.scrollTop;
    return bookmarks.some(
      (b) => Math.abs(parseFloat(b.position) - scrollPos) < 150
    );
  }, [bookDetails, bookmarks, currentPage, layoutMode, readerRef]);

  const handleBookmarkClick = useCallback(
    (
      position: string,
      updatePaginationInfo: () => void,
      setIsRightHovered: (v: boolean) => void
    ) => {
      if (bookDetails?.file_type === "pdf") {
        const pgNum = parseInt(position, 10);
        if (!isNaN(pgNum)) {
          // Caller handles setCurrentPage and setActiveChapter
        }
        setIsRightHovered(false);
        return pgNum;
      }

      if (readerRef.current) {
        if (layoutMode === "redesign") {
          readerRef.current.scrollTo({
            left: parseFloat(position),
            behavior: "smooth",
          });
        } else {
          readerRef.current.scrollTo({
            top: parseFloat(position),
            behavior: "smooth",
          });
        }
        updatePaginationInfo();
      }
      setIsRightHovered(false);
      return null;
    },
    [bookDetails, layoutMode, readerRef]
  );

  return {
    bookmarks,
    setBookmarks,
    loadBookmarks,
    toggleBookmark,
    isBookmarked,
    handleBookmarkClick,
  };
}
