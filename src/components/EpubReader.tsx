import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FiMenu, 
  FiSettings, 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronUp,
  FiChevronDown,
  FiArrowLeft,
  FiBookmark,
  FiX,
  FiList,
  FiHeart,
  FiBookOpen
} from "react-icons/fi";
import { tauriService } from "../services/tauriService";
import { BookDetails, Chapter, Bookmark } from "../types";
import SettingsModal from "./SettingsModal";
import { useReaderSettings } from "../hooks/useReaderSettings";
import { useEpubParser } from "../hooks/useEpubParser";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { useBookmarks } from "../hooks/useBookmarks";

export interface EpubReaderProps {
  bookDetails: BookDetails;
  userId: number;
}

const EpubReader: React.FC<EpubReaderProps> = ({ bookDetails, userId }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // References
  const readerRef = useRef<HTMLDivElement>(null);
  const lastNavTimeRef = useRef<number>(0);

  // Reader Settings Hook
  const {
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    fontFamily,
    setFontFamily,
    readerTheme,
    setReaderTheme,
    layoutMode: readerLayoutMode,
    setLayoutMode: setReaderLayoutMode,
  } = useReaderSettings();

  // EPUB Parser Hook
  const { htmlContent, chapters, parseEpub } = useEpubParser();

  // States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeChapter, setActiveChapter] = useState<string>("Beginning");
  const [targetScroll, setTargetScroll] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isLeftHovered, setIsLeftHovered] = useState<boolean>(false);
  const [isRightHovered, setIsRightHovered] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

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

  // Reading Progress Hook
  const {
    loadProgressAndBookmarks,
    handleScroll,
    updatePaginationInfo,
  } = useReadingProgress({
    readerRef,
    bookDetails,
    userId,
    layoutMode: readerLayoutMode,
    chapters,
    currentPage,
    totalPages,
    setCurrentPage,
    setTotalPages,
    setActiveChapter,
    getPageScrollStep,
  });

  // Bookmarks Hook
  const {
    bookmarks,
    loadBookmarks,
    toggleBookmark,
    isBookmarked,
    handleBookmarkClick: handleBookmarkClickHelper,
  } = useBookmarks({
    readerRef,
    bookDetails,
    userId,
    layoutMode: readerLayoutMode,
    currentPage,
    activeChapter,
  });

  // Load epub parser and cover/favorite metadata
  useEffect(() => {
    if (bookDetails.file_path) {
      parseEpub(bookDetails.file_path);
    }
  }, [bookDetails.file_path, parseEpub]);

  useEffect(() => {
    loadBookmarks(bookDetails.id);
    loadProgressAndBookmarks(bookDetails.id).then(({ targetScroll: loadedScroll }) => {
      setTargetScroll(loadedScroll);
    });
  }, [bookDetails.id, loadBookmarks, loadProgressAndBookmarks]);

  useEffect(() => {
    const fetchCover = async () => {
      try {
        const coverBytes = await tauriService.getCoverImg(bookDetails.id);
        if (coverBytes && coverBytes.length > 0) {
          const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
          setCoverUrl(URL.createObjectURL(blob));
        }
      } catch (e) {
        console.warn("Failed to load cover image:", e);
      }
    };
    fetchCover();

    const savedFavs = localStorage.getItem(`stellaron-favorites-${userId}`);
    if (savedFavs) {
      const favArray: number[] = JSON.parse(savedFavs);
      setIsFavorite(favArray.includes(bookDetails.id));
    }
  }, [bookDetails, userId]);

  // Safe scroll restoration effect running after HTML content is mounted in layout
  useEffect(() => {
    if (htmlContent && readerRef.current) {
      const timer = setTimeout(() => {
        const container = readerRef.current;
        if (!container) return;

        // Check if we requested a deep-link jump to a chapter
        const jumpToChapterId = location.state?.jumpToChapterId;
        if (jumpToChapterId) {
          const el = container.querySelector(`#${jumpToChapterId}`);
          if (el) {
            if (readerLayoutMode === "redesign") {
              const containerLeft = container.getBoundingClientRect().left;
              const elementLeft = el.getBoundingClientRect().left;
              container.scrollLeft = elementLeft - containerLeft;
            } else {
              el.scrollIntoView();
            }
            updatePaginationInfo();
            // Clear router state to prevent jump on subsequent changes/refreshes
            window.history.replaceState({}, document.title);
            return;
          }
        }

        // Fallback to last-saved scroll progress
        if (targetScroll !== null) {
          if (readerLayoutMode === "redesign") {
            container.scrollLeft = targetScroll;
          } else {
            container.scrollTop = targetScroll;
          }
          updatePaginationInfo();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [htmlContent, targetScroll, readerLayoutMode, location.state, updatePaginationInfo]);

  const toggleFavorite = () => {
    const bookId = bookDetails.id;
    const savedFavs = localStorage.getItem(`stellaron-favorites-${userId}`);
    const favSet = savedFavs ? new Set<number>(JSON.parse(savedFavs)) : new Set<number>();
    
    if (favSet.has(bookId)) {
      favSet.delete(bookId);
      setIsFavorite(false);
    } else {
      favSet.add(bookId);
      setIsFavorite(true);
    }
    localStorage.setItem(`stellaron-favorites-${userId}`, JSON.stringify(Array.from(favSet)));
  };

  const toggleReaderLayout = () => {
    const next = readerLayoutMode === "classic" ? "redesign" : "classic";
    setReaderLayoutMode(next);
  };

  const navigatePage = useCallback((direction: "prev" | "next") => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 450) {
      return;
    }
    lastNavTimeRef.current = now;

    if (readerRef.current) {
      if (readerLayoutMode === "redesign") {
        const step = getPageScrollStep(readerRef.current);
        readerRef.current.scrollBy({ 
          left: direction === "prev" ? -step : step, 
          behavior: "smooth" 
        });
      } else {
        const step = readerRef.current.clientHeight * 0.9;
        readerRef.current.scrollBy({ 
          top: direction === "prev" ? -step : step, 
          behavior: "smooth" 
        });
      }
    }
  }, [readerLayoutMode, getPageScrollStep]);

  // Keyboard navigation for reading modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcutsEnabled = localStorage.getItem("stellaron-enable-shortcuts") !== "false";
      if (!shortcutsEnabled) return;

      if (readerLayoutMode === "redesign") {
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
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [readerLayoutMode, navigatePage]);

  // Mouse wheel navigation for paginated (redesign) mode
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (readerLayoutMode !== "redesign") return;

      if (Math.abs(e.deltaY) > 10) {
        e.preventDefault();
        if (e.deltaY > 0) {
          navigatePage("next");
        } else {
          navigatePage("prev");
        }
      } else if (Math.abs(e.deltaX) > 15) {
        e.preventDefault();
        if (e.deltaX > 0) {
          navigatePage("next");
        } else {
          navigatePage("prev");
        }
      }
    };

    const container = readerRef.current;
    if (container && readerLayoutMode === "redesign") {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, [readerLayoutMode, navigatePage]);

  const scrollToAnchor = (targetId: string) => {
    const container = readerRef.current;
    if (!container) return;
    const cleanId = targetId.startsWith("#") ? targetId.slice(1) : targetId;
    try {
      const escapedId = CSS.escape(cleanId);
      const el = container.querySelector(`#${escapedId}`) || container.querySelector(`[name="${escapedId}"]`);
      if (el) {
        if (readerLayoutMode === "redesign") {
          const containerLeft = container.getBoundingClientRect().left;
          const elementLeft = el.getBoundingClientRect().left;
          container.scrollBy({ left: elementLeft - containerLeft, behavior: "smooth" });
        } else {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    } catch (e) {
      console.warn("Failed to scroll to anchor:", cleanId, e);
    }
  };

  const handleChapterClick = (chapterId: string) => {
    scrollToAnchor(chapterId);
    setIsLeftHovered(false);
  };

  const handleBookmarkClick = (position: string) => {
    handleBookmarkClickHelper(position, updatePaginationInfo, setIsRightHovered);
  };

  const getThemeStyles = () => {
    if (readerTheme === "cream") {
      return {
        "--color-bg": "#fcf8f2",
        "--color-surface": "#fcf8f2",
        "--color-surface-container": "#f5eedc",
        "--color-surface-container-low": "#faf5e8",
        "--color-surface-container-high": "#ebe2cc",
        "--color-surface-container-highest": "#e1d6be",
        "--color-surface-container-lowest": "#fffefb",
        "--color-on-surface": "#2c2015",
        "--color-on-surface-variant": "#5a4a3a",
        "--color-text": "#2c2015",
        "--color-text-dim": "#5a4a3a",
        "--color-border": "rgba(44, 32, 21, 0.12)",
        "--color-outline-variant": "#ebe2cc",
        "backgroundColor": "#fcf8f2",
        "color": "#2c2015"
      } as React.CSSProperties;
    }
    if (readerTheme === "sepia") {
      return {
        "--color-bg": "#f4ecd8",
        "--color-surface": "#f4ecd8",
        "--color-surface-container": "#e9dfc6",
        "--color-surface-container-low": "#eedfb8",
        "--color-surface-container-high": "#e3d4b6",
        "--color-surface-container-highest": "#dacba8",
        "--color-surface-container-lowest": "#fdfaf2",
        "--color-on-surface": "#433422",
        "--color-on-surface-variant": "#6c5d4d",
        "--color-text": "#433422",
        "--color-text-dim": "#6c5d4d",
        "--color-border": "rgba(67, 52, 34, 0.12)",
        "--color-outline-variant": "#d5c7a9",
        "backgroundColor": "#f4ecd8",
        "color": "#433422"
      } as React.CSSProperties;
    }
    return {
      "--color-bg": "#131411",
      "--color-surface": "#131411",
      "--color-surface-container": "#20201d",
      "--color-surface-container-low": "#1c1c19",
      "--color-surface-container-high": "#2a2a27",
      "--color-surface-container-highest": "#353532",
      "--color-surface-container-lowest": "#0e0e0c",
      "--color-on-surface": "#e5e2dd",
      "--color-on-surface-variant": "#c5c6ca",
      "--color-text": "#e5e2dd",
      "--color-text-dim": "#c5c6ca",
      "--color-border": "rgba(229, 226, 221, 0.1)",
      "--color-outline-variant": "#44474a",
      "backgroundColor": "#131411",
      "color": "#e5e2dd"
    } as React.CSSProperties;
  };

  const getThemeClasses = () => {
    return "bg-surface text-on-surface border-outline-variant/15";
  };

  const getLineHeightClass = () => {
    if (lineHeight === 1.4) return "leading-normal";
    if (lineHeight === 1.8) return "leading-loose";
    return "leading-relaxed";
  };

  const getPercentage = () => {
    if (totalPages <= 1) return 0;
    return Math.round(((currentPage - 1) / (totalPages - 1)) * 100);
  };

  const readerSettingsForModal = {
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    fontFamily,
    setFontFamily,
    readerTheme,
    setReaderTheme,
    readerLayoutMode,
    setReaderLayoutMode,
  };

  return (
    <div 
      style={getThemeStyles()}
      className={`fixed inset-0 flex overflow-hidden ${getThemeClasses()} selection:bg-tertiary/20 selection:text-tertiary`}
    >
      {readerLayoutMode === "redesign" && (
        <div className="absolute inset-0 pointer-events-none z-50 bg-repeat bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.04%22/%3E%3C/svg%3E')]" />
      )}

      {/* Chapters Left Hover Drawer */}
      <nav 
        className={`fixed left-0 top-0 h-screen w-80 bg-surface-container-highest/95 backdrop-blur-2xl border-r border-outline-variant/20 shadow-2xl z-40 flex flex-col p-6 origin-left reader-drawer-left ${
          isLeftHovered 
            ? "translate-x-0 opacity-100 pointer-events-auto" 
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => setIsLeftHovered(true)}
        onMouseLeave={() => setIsLeftHovered(false)}
      >
        <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4 mb-4">
          <div className="w-10 h-14 bg-surface-container rounded shadow-sm border border-outline-variant/10 flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
            {coverUrl ? (
              <img src={coverUrl} alt={bookDetails.title} className="w-full h-full object-cover animate-fade-in cover-image" />
            ) : (
              "EPUB"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-xs font-bold text-on-surface truncate leading-tight">{bookDetails.title}</h3>
            <p className="text-[10px] text-on-surface-variant truncate mt-1">{bookDetails.author || "Unknown Author"}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 border-b border-outline-variant/15 pb-2">
          <h2 className="font-serif text-sm font-bold text-tertiary">Chapters</h2>
          <button 
            onClick={() => setIsLeftHovered(false)}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-1">
          {chapters.map((chap, idx) => {
            const isCurrent = activeChapter === chap.title;
            return (
              <button
                key={chap.id}
                onClick={() => handleChapterClick(chap.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-serif transition duration-200 cursor-pointer flex items-center justify-between group ${
                  isCurrent 
                    ? "text-tertiary font-bold bg-tertiary/10 border border-tertiary/20" 
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                } ${isLeftHovered ? "animate-slide-in-left" : ""}`}
                style={{
                  animationDelay: isLeftHovered ? `${idx * 20}ms` : "0ms"
                }}
              >
                <span className="truncate pr-2">{chap.title}</span>
                <FiChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isCurrent ? "translate-x-0.5 text-tertiary" : "opacity-0 group-hover:opacity-100"}`} />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Chapters Left Edge Hover trigger zone */}
      <div 
        className="fixed left-0 top-0 w-16 h-screen z-30 cursor-pointer"
        onMouseEnter={() => setIsLeftHovered(true)}
      />

      {/* Bookmarks Right Hover Drawer */}
      <nav 
        className={`fixed right-0 top-0 h-screen w-80 bg-surface-container-highest/95 backdrop-blur-2xl border-l border-outline-variant/20 shadow-2xl z-40 flex flex-col p-6 origin-right reader-drawer-right ${
          isRightHovered 
            ? "translate-x-0 opacity-100 pointer-events-auto" 
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => setIsRightHovered(true)}
        onMouseLeave={() => setIsRightHovered(false)}
      >
        <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4 mb-4">
          <div className="w-10 h-14 bg-surface-container rounded shadow-sm border border-outline-variant/10 flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
            {coverUrl ? (
              <img src={coverUrl} alt={bookDetails.title} className="w-full h-full object-cover animate-fade-in cover-image" />
            ) : (
              "EPUB"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-xs font-bold text-on-surface truncate leading-tight">{bookDetails.title}</h3>
            <p className="text-[10px] text-on-surface-variant truncate mt-1">{bookDetails.author || "Unknown Author"}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 border-b border-outline-variant/15 pb-2">
          <h2 className="font-serif text-sm font-bold text-tertiary">Bookmarks</h2>
          <button 
            onClick={() => setIsRightHovered(false)}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-1">
          {bookmarks.length === 0 ? (
            <div className="text-xs text-on-surface-variant/70 italic text-center py-8">No bookmarks saved yet</div>
          ) : (
            bookmarks.map((bm, idx) => (
              <button
                key={bm.bookmark_id}
                onClick={() => handleBookmarkClick(bm.position)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-serif text-on-surface-variant hover:text-on-surface transition mb-1 cursor-pointer flex flex-col gap-1 bookmark-card border border-transparent/5 bg-transparent ${isRightHovered ? "animate-slide-in-right" : ""}`}
                style={{
                  animationDelay: isRightHovered ? `${idx * 20}ms` : "0ms"
                }}
              >
                <div className="truncate text-on-surface font-semibold flex items-center gap-1.5">
                  <FiBookmark className="w-3.5 h-3.5 text-tertiary fill-current shrink-0" />
                  <span>{bm.chapter_title || "Chapter"}</span>
                </div>
                <div className="text-[10px] text-on-surface-variant/70 pl-5">Page {bm.page_number}</div>
              </button>
            ))
          )}
        </div>
      </nav>

      {/* Bookmarks Right Edge Hover trigger zone */}
      <div 
        className="fixed right-0 top-0 w-16 h-screen z-30 cursor-pointer"
        onMouseEnter={() => setIsRightHovered(true)}
      />

      {/* Floating Prev/Next Page Buttons (Only in Paginated/Redesign Mode at Screen Edges) */}
      {readerLayoutMode === "redesign" && (
        <>
          <button
            onClick={() => navigatePage("prev")}
            disabled={currentPage === 1}
            className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-highest/85 backdrop-blur-md border border-outline-variant/20 shadow-lg text-on-surface hover:text-tertiary disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Previous Page"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => navigatePage("next")}
            disabled={currentPage === totalPages}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-highest/85 backdrop-blur-md border border-outline-variant/20 shadow-lg text-on-surface hover:text-tertiary disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Next Page"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Floating Scroll Up/Down Column (Only in Scrollable/Classic Mode next to text) */}
      {readerLayoutMode === "classic" && (
        <div className="fixed left-1/2 top-1/2 -translate-y-1/2 pointer-events-none z-50 w-full max-w-3xl -translate-x-1/2 px-6">
          <div className="relative w-full h-full">
            <div className="absolute right-2 lg:right-auto lg:left-full lg:ml-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
              <button
                onClick={() => navigatePage("prev")}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-surface-container-highest/85 backdrop-blur-md border border-outline-variant/20 shadow-lg text-on-surface hover:text-tertiary disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Scroll Up"
              >
                <FiChevronUp className="w-5.5 h-5.5" />
              </button>
              <button
                onClick={() => navigatePage("next")}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-surface-container-highest/85 backdrop-blur-md border border-outline-variant/20 shadow-lg text-on-surface hover:text-tertiary disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Scroll Down"
              >
                <FiChevronDown className="w-5.5 h-5.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <header 
        className="fixed top-0 left-0 w-full bg-surface-container/90 backdrop-blur-md border-b border-outline-variant/10 shadow-sm px-8 py-4 flex justify-between items-center z-30 h-16 reader-header-bar opacity-100 translate-y-0"
        id="readingHeader"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-outline-variant/20 hover:border-red-400/40 bg-surface-container/30 hover:bg-red-500/10 text-on-surface hover:text-red-400 transition cursor-pointer"
            title="Exit Reader"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
          <div className="w-[1px] h-4 bg-outline-variant/20" />
          <span className="font-display-lg text-sm text-on-surface font-semibold max-w-xs truncate">
            {bookDetails.title}
          </span>
          <span className="text-xs text-on-surface-variant truncate hidden md:inline">
            &bull; {activeChapter}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Reader layout toggler */}
          <button
            onClick={toggleReaderLayout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-outline-variant/20 hover:border-tertiary/40 bg-surface-container/30 hover:bg-surface-container-high transition flex items-center gap-1.5 cursor-pointer text-on-surface"
          >
            <FiBookOpen className="w-3.5 h-3.5 text-tertiary" />
            <span>{readerLayoutMode === "redesign" ? "Paginated Mode" : "Scrollable Mode"}</span>
          </button>

          {/* Favorite Toggler */}
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded hover:bg-surface-container-high transition cursor-pointer ${isFavorite ? "text-secondary" : "text-on-surface-variant"}`}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <FiHeart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>

          {/* Bookmark Toggler */}
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded hover:bg-surface-container-high transition cursor-pointer ${isBookmarked() ? "text-tertiary" : "text-on-surface-variant"}`}
            title="Toggle Bookmark"
          >
            <FiBookmark className={`w-4 h-4 ${isBookmarked() ? "fill-current" : ""}`} />
          </button>
          
          {/* Settings Toggler */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 rounded hover:bg-surface-container-high transition cursor-pointer ${isSettingsOpen ? "text-tertiary" : "text-on-surface-variant"}`}
          >
            <FiSettings className="w-4 h-4" />
          </button>

          {/* Chapter Menu Toggler */}
          <button
            onClick={() => setIsLeftHovered(!isLeftHovered)}
            className={`p-2 rounded hover:bg-surface-container-high transition cursor-pointer ${isLeftHovered ? "text-tertiary" : "text-on-surface-variant"}`}
            title="Table of Chapters"
          >
            <FiMenu className="w-4 h-4" />
          </button>

          {/* Bookmark List Toggler */}
          <button
            onClick={() => setIsRightHovered(!isRightHovered)}
            className={`p-2 rounded hover:bg-surface-container-high transition cursor-pointer ${isRightHovered ? "text-tertiary" : "text-on-surface-variant"}`}
            title="Bookmarks List"
          >
            <FiList className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        initialTab="reader" 
        readerSettings={readerSettingsForModal} 
      />

      {/* FLUID READER CONTENT CANVAS */}
      <main 
        ref={readerRef}
        onScroll={handleScroll}
        onMouseEnter={() => {
          setIsLeftHovered(false);
          setIsRightHovered(false);
        }}
        className={`flex-1 no-scrollbar transition-all duration-300 w-full h-full ${
          readerLayoutMode === "redesign" 
            ? "flex items-center overflow-y-hidden overflow-x-auto py-16 px-12 md:py-20 md:px-24" 
            : "overflow-y-auto py-24 px-6 max-w-3xl mx-auto"
        }`}
      >
        <article 
          className={`w-full mx-auto transition-all duration-300 ${fontFamily} ${getLineHeightClass()} ${
            readerLayoutMode === "redesign"
              ? "paginated-reader-content text-justify relative shrink-0 snap-start pr-8"
              : "text-justify"
          }`}
          style={{ 
            fontSize: `${fontSize}px`,
          }}
        >
          {readerLayoutMode === "redesign" && (
            <style dangerouslySetInnerHTML={{ __html: `
              p:first-of-type::first-letter {
                font-size: 4.5rem;
                font-family: var(--font-serif);
                color: var(--color-tertiary);
                float: left;
                margin-right: 12px;
                margin-top: -6px;
                font-weight: bold;
                line-height: 1;
              }
            `}} />
          )}

          <div 
            className={`epub-rendered-content space-y-5 ${readerLayoutMode === "redesign" ? "h-full w-auto max-w-none" : ""}`}
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
            onClick={(e) => {
              const target = e.target as HTMLElement;
              const anchor = target.closest("a");
              if (anchor) {
                const href = anchor.getAttribute("href");
                if (href && href.startsWith("#")) {
                  e.preventDefault();
                  scrollToAnchor(href);
                }
              }
            }}
          />
        </article>
      </main>

      {/* BOTTOM PROGRESS BAR */}
      {readerLayoutMode === "redesign" ? (
        <div className="fixed bottom-0 left-0 w-full h-1 bg-surface-container-high/40 z-30 overflow-hidden">
          <div 
            className="h-full bg-tertiary transition-all duration-300 shadow-[0_0_8px_rgba(255,183,131,0.5)]" 
            style={{ width: `${getPercentage()}%` }}
          />
        </div>
      ) : (
        <footer 
          className="fixed bottom-0 left-0 w-full z-30 h-12 border-t border-outline-variant/10 bg-surface-container/60"
          id="readingFooter"
        >
          <div className="w-full h-full flex justify-center items-center px-8 py-3 bg-surface-container/90 backdrop-blur-md">
            <div className="text-on-surface-variant text-center text-xs flex flex-col items-center">
              <span>Page <span className="text-on-surface font-bold">{currentPage}</span> of <span className="text-on-surface font-bold">{totalPages}</span></span>
              <div className="w-32 h-1 bg-outline-variant/20 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-tertiary" 
                  style={{ width: `${getPercentage()}%` }}
                />
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default EpubReader;
