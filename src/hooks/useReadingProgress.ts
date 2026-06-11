import { useEffect, useRef, useCallback, MutableRefObject } from "react";
import { tauriService } from "../services/tauriService";
import { BookDetails, Chapter, ProgressInfo } from "../types";

interface UseReadingProgressOptions {
  readerRef: MutableRefObject<HTMLDivElement | null>;
  bookDetails: BookDetails | null;
  userId: number;
  layoutMode: "classic" | "redesign";
  chapters: Chapter[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setTotalPages: React.Dispatch<React.SetStateAction<number>>;
  setActiveChapter: React.Dispatch<React.SetStateAction<string>>;
  getPageScrollStep: (container: HTMLDivElement) => number;
}

interface UseReadingProgressReturn {
  loadProgressAndBookmarks: (bookId: number) => Promise<{ targetScroll: number | null }>;
  handleScroll: () => void;
  updatePaginationInfo: () => void;
}

/**
 * Manages reading progress auto-save, scroll restoration, and pagination tracking.
 * Extracts the complex progress/scroll coordination from BookPage.
 */
export function useReadingProgress({
  readerRef,
  bookDetails,
  userId,
  layoutMode,
  chapters,
  currentPage,
  totalPages,
  setCurrentPage,
  setTotalPages,
  setActiveChapter,
  getPageScrollStep,
}: UseReadingProgressOptions): UseReadingProgressReturn {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({ activeChapter: "Beginning", currentPage: 1 });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = { activeChapter: stateRef.current.activeChapter, currentPage };
  }, [currentPage]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // PDF progress auto-save
  useEffect(() => {
    if (!bookDetails || bookDetails.file_type !== "pdf" || !userId) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      const progressPercent =
        totalPages > 1 ? ((currentPage - 1) / (totalPages - 1)) * 100 : 0;
      try {
        await tauriService.updateReadingProgress({
          userId,
          bookId: bookDetails.id,
          currentPosition: String(currentPage),
          chapterTitle: `Page ${currentPage}`,
          pageNumber: currentPage,
          progressPercentage: progressPercent,
        });
      } catch (e) {
        console.error("Failed to auto-save PDF progress:", e);
      }
    }, 1000);
  }, [currentPage, bookDetails, userId, totalPages]);

  const loadProgressAndBookmarks = useCallback(
    async (bookId: number) => {
      try {
        const prog = await tauriService.getReadingProgress({
          userId,
          bookId,
        });
        if (prog && prog.current_position) {
          return { targetScroll: parseFloat(prog.current_position) };
        }
      } catch (e) {
        console.error("Failed to fetch progress:", e);
      }
      return { targetScroll: 0 };
    },
    [userId]
  );

  const updatePaginationInfo = useCallback(() => {
    if (bookDetails?.file_type === "pdf") return;
    const container = readerRef.current;
    if (!container) return;

    if (layoutMode === "redesign") {
      const { scrollLeft, scrollWidth } = container;
      const containerStyle = window.getComputedStyle(container);
      const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
      const step = getPageScrollStep(container) || 1;

      const article = container.querySelector("article");
      let columnGap = 0;
      if (article) {
        const articleStyle = window.getComputedStyle(article);
        columnGap = parseFloat(articleStyle.columnGap) || 0;
      }

      const estimatedTotal = Math.max(
        1,
        Math.ceil((scrollWidth - paddingLeft - paddingRight + columnGap) / step)
      );
      const estimatedCurrent = Math.min(
        estimatedTotal,
        Math.max(1, Math.round(scrollLeft / step) + 1)
      );
      setTotalPages(estimatedTotal);
      setCurrentPage(estimatedCurrent);
    } else {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const estimatedTotal = Math.max(1, Math.ceil(scrollHeight / clientHeight));
      const estimatedCurrent = Math.min(
        estimatedTotal,
        Math.max(1, Math.ceil(scrollTop / clientHeight) + 1)
      );
      setTotalPages(estimatedTotal);
      setCurrentPage(estimatedCurrent);
    }

    // Identify active chapter
    if (chapters.length > 0) {
      let currentChap = chapters[0].title;
      for (const chap of chapters) {
        const el = container.querySelector(`#${chap.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          if (layoutMode === "redesign") {
            if (rect.left - containerRect.left <= container.clientWidth * 0.5) {
              currentChap = chap.title;
            }
          } else {
            if (rect.top - containerRect.top <= 100) {
              currentChap = chap.title;
            }
          }
        }
      }
      setActiveChapter(currentChap);
      stateRef.current.activeChapter = currentChap;
    }
  }, [
    bookDetails,
    layoutMode,
    chapters,
    readerRef,
    getPageScrollStep,
    setTotalPages,
    setCurrentPage,
    setActiveChapter,
  ]);

  const handleScroll = useCallback(() => {
    if (bookDetails?.file_type === "pdf") return;
    updatePaginationInfo();

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      const container = readerRef.current;
      if (!container || !bookDetails || !userId) return;

      let progressPercent = 0;
      let positionVal = "0";

      if (layoutMode === "redesign") {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        progressPercent =
          scrollWidth > clientWidth
            ? (scrollLeft / (scrollWidth - clientWidth)) * 100
            : 0;
        positionVal = String(scrollLeft);
      } else {
        const { scrollTop, scrollHeight, clientHeight } = container;
        progressPercent =
          scrollHeight > clientHeight
            ? (scrollTop / (scrollHeight - clientHeight)) * 100
            : 0;
        positionVal = String(scrollTop);
      }

      const { activeChapter: currentChap, currentPage: currentPg } = stateRef.current;

      try {
        await tauriService.updateReadingProgress({
          userId,
          bookId: bookDetails.id,
          currentPosition: positionVal,
          chapterTitle: currentChap,
          pageNumber: currentPg,
          progressPercentage: progressPercent,
        });
      } catch (e) {
        console.error("Failed to auto-save progress:", e);
      }
    }, 1200);
  }, [bookDetails, userId, layoutMode, readerRef, updatePaginationInfo]);

  return {
    loadProgressAndBookmarks,
    handleScroll,
    updatePaginationInfo,
  };
}
