import { useEffect, useRef, useCallback, MutableRefObject } from "react";

interface UseReaderNavigationOptions {
  readerRef: MutableRefObject<HTMLDivElement | null>;
  layoutMode: "classic" | "redesign";
  fileType: string | undefined;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (updater: (prev: number) => number) => void;
  onScroll?: () => void;
}

/**
 * Manages keyboard, mouse wheel, and programmatic navigation for the reader.
 * Extracts navigation logic from BookPage to reduce its complexity.
 */
export function useReaderNavigation({
  readerRef,
  layoutMode,
  fileType,
  currentPage,
  totalPages,
  setCurrentPage,
  onScroll,
}: UseReaderNavigationOptions) {
  const lastNavTimeRef = useRef<number>(0);

  const getPageScrollStep = useCallback((container: HTMLDivElement): number => {
    const containerStyle = window.getComputedStyle(container);
    const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
    const visibleWidth = container.clientWidth - paddingLeft - paddingRight;

    const article = container.querySelector("article");
    let columnGap = 0;
    if (article) {
      const articleStyle = window.getComputedStyle(article);
      columnGap = parseFloat(articleStyle.columnGap) || 0;
    }

    return visibleWidth + columnGap;
  }, []);

  const navigatePage = useCallback(
    (direction: "prev" | "next") => {
      if (fileType === "pdf") {
        if (direction === "prev") {
          setCurrentPage((prev) => Math.max(1, prev - 1));
        } else {
          setCurrentPage((prev) => Math.min(totalPages, prev + 1));
        }
        return;
      }

      const now = Date.now();
      if (now - lastNavTimeRef.current < 450) return;
      lastNavTimeRef.current = now;

      if (readerRef.current) {
        if (layoutMode === "redesign") {
          const step = getPageScrollStep(readerRef.current);
          readerRef.current.scrollBy({
            left: direction === "prev" ? -step : step,
            behavior: "smooth",
          });
        } else {
          const step = readerRef.current.clientHeight * 0.9;
          readerRef.current.scrollBy({
            top: direction === "prev" ? -step : step,
            behavior: "smooth",
          });
        }
      }
    },
    [fileType, totalPages, layoutMode, readerRef, getPageScrollStep, setCurrentPage]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcutsEnabled =
        localStorage.getItem("stellaron-enable-shortcuts") !== "false";
      if (!shortcutsEnabled) return;

      if (layoutMode === "redesign") {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          navigatePage("prev");
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          navigatePage("next");
        }
      } else {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          navigatePage("prev");
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          navigatePage("next");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [layoutMode, navigatePage]);

  // Mouse wheel navigation for paginated mode
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (layoutMode !== "redesign") return;

      if (Math.abs(e.deltaY) > 10) {
        e.preventDefault();
        navigatePage(e.deltaY > 0 ? "next" : "prev");
      } else if (Math.abs(e.deltaX) > 15) {
        e.preventDefault();
        navigatePage(e.deltaX > 0 ? "next" : "prev");
      }
    };

    const container = readerRef.current;
    if (container && layoutMode === "redesign") {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, [layoutMode, navigatePage, readerRef]);

  const scrollToAnchor = useCallback(
    (targetId: string) => {
      const container = readerRef.current;
      if (!container) return;
      const cleanId = targetId.startsWith("#") ? targetId.slice(1) : targetId;
      try {
        const escapedId = CSS.escape(cleanId);
        const el =
          container.querySelector(`#${escapedId}`) ||
          container.querySelector(`[name="${escapedId}"]`);
        if (el) {
          if (layoutMode === "redesign") {
            const containerLeft = container.getBoundingClientRect().left;
            const elementLeft = el.getBoundingClientRect().left;
            container.scrollBy({
              left: elementLeft - containerLeft,
              behavior: "smooth",
            });
          } else {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }
      } catch (e) {
        console.warn("Failed to scroll to anchor:", cleanId, e);
      }
    },
    [layoutMode, readerRef]
  );

  return {
    navigatePage,
    scrollToAnchor,
    getPageScrollStep,
  };
}
