import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiMenu, 
  FiSettings, 
  FiChevronLeft, 
  FiChevronRight, 
  FiArrowLeft,
  FiBookmark,
  FiX,
  FiList,
  FiHeart
} from "react-icons/fi";
import { tauriService } from "../services/tauriService";
import { BookDetails } from "../types";
import SettingsModal from "./SettingsModal";
import { useReaderSettings } from "../hooks/useReaderSettings";
import { useEpubParser } from "../hooks/useEpubParser";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { useBookmarks } from "../hooks/useBookmarks";

export interface PdfReaderProps {
  bookDetails: BookDetails;
  userId: number;
}

const PdfReader: React.FC<PdfReaderProps> = ({ bookDetails, userId }) => {
  const navigate = useNavigate();

  // References
  const readerRef = useRef<HTMLDivElement>(null);

  // Reader Settings Hook for theme
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

  // EPUB Parser Hook (provides parsePdfChapters and chapters)
  const { chapters, parsePdfChapters } = useEpubParser();

  // States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeChapter, setActiveChapter] = useState<string>("Page 1");
  const [pdfPageData, setPdfPageData] = useState<string | null>(null);
  const [pdfPageLoading, setPdfPageLoading] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isLeftHovered, setIsLeftHovered] = useState<boolean>(false);
  const [isRightHovered, setIsRightHovered] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const getPageScrollStep = useCallback(() => 0, []);

  // Reading Progress Hook
  const {
    loadProgressAndBookmarks,
  } = useReadingProgress({
    readerRef,
    bookDetails,
    userId,
    layoutMode: "classic",
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
    layoutMode: "classic",
    currentPage,
    activeChapter,
  });

  // Initialize PDF Page count and chapters
  useEffect(() => {
    const initPdf = async () => {
      try {
        const pageCount = await tauriService.getPdfPageCount(bookDetails.file_path);
        setTotalPages(pageCount);
        await parsePdfChapters(bookDetails.file_path);
      } catch (e) {
        console.error("Failed to initialize PDF details:", e);
      }
    };
    initPdf();
  }, [bookDetails.file_path, parsePdfChapters]);

  // Load progress and bookmarks once pageCount is loaded
  useEffect(() => {
    if (totalPages > 1) {
      loadBookmarks(bookDetails.id);
      loadProgressAndBookmarks(bookDetails.id).then(({ targetScroll: loadedScroll }) => {
        if (loadedScroll !== null && loadedScroll > 0) {
          const initialPg = Math.max(1, Math.min(totalPages, Math.round(loadedScroll) || 1));
          setCurrentPage(initialPg);
          setActiveChapter(`Page ${initialPg}`);
        }
      });
    }
  }, [bookDetails.id, totalPages, loadBookmarks, loadProgressAndBookmarks]);

  // Fetch cover and favorite details
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

  // Fetch PDF Page data on page change
  useEffect(() => {
    const fetchPdfPage = async () => {
      try {
        setPdfPageLoading(true);
        const page = await tauriService.readPdfPage(
          bookDetails.file_path, 
          currentPage - 1 
        );
        setPdfPageData(page.image_data);
        setActiveChapter(`Page ${currentPage}`);
      } catch (err) {
        console.error("Failed to read PDF page:", err);
      } finally {
        setPdfPageLoading(false);
      }
    };
    fetchPdfPage();
  }, [currentPage, bookDetails.file_path]);

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

  const navigatePage = useCallback((direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentPage(prev => Math.max(1, prev - 1));
    } else {
      setCurrentPage(prev => Math.min(totalPages, prev + 1));
    }
  }, [totalPages]);

  // Keyboard navigation for PDF reader
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcutsEnabled = localStorage.getItem("stellaron-enable-shortcuts") !== "false";
      if (!shortcutsEnabled) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        navigatePage("prev");
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        navigatePage("next");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigatePage]);

  const handleChapterClick = (chapterId: string) => {
    if (chapterId.startsWith("page-")) {
      const pgNum = parseInt(chapterId.replace("page-", ""), 10);
      if (!isNaN(pgNum)) {
        setCurrentPage(pgNum);
      }
    }
    setIsLeftHovered(false);
  };

  const handleBookmarkClick = (position: string) => {
    const pgNum = parseInt(position, 10);
    if (!isNaN(pgNum)) {
      setCurrentPage(pgNum);
    }
    setIsRightHovered(false);
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
              "PDF"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-xs font-bold text-on-surface truncate leading-tight">{bookDetails.title}</h3>
            <p className="text-[10px] text-on-surface-variant truncate mt-1">{bookDetails.author || "Unknown Author"}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 border-b border-outline-variant/15 pb-2">
          <h2 className="font-serif text-sm font-bold text-tertiary">Pages</h2>
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
                  animationDelay: isLeftHovered ? `${idx * 15}ms` : "0ms"
                }}
              >
                <span className="truncate pr-2">{chap.title}</span>
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
              "PDF"
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
                  <span>{bm.chapter_title || "Page"}</span>
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

      {/* Floating Prev/Next Page Buttons */}
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
        onMouseEnter={() => {
          setIsLeftHovered(false);
          setIsRightHovered(false);
        }}
        className="flex-1 transition-all duration-300 w-full h-full flex items-center justify-center p-8 bg-[#111] overflow-hidden"
      >
        <div className="flex flex-col items-center justify-center w-full h-full p-4 overflow-auto">
          {pdfPageLoading ? (
            <div className="text-on-surface-variant/80 text-sm font-semibold animate-pulse">
              Rendering page...
            </div>
          ) : pdfPageData ? (
            <img 
              src={`data:image/png;base64,${pdfPageData}`} 
              alt={`Page ${currentPage}`}
              className="max-h-full max-w-full object-contain rounded-lg shadow-xl border border-outline-variant/15 select-none"
            />
          ) : (
            <div className="text-red-400 text-sm">Failed to render page.</div>
          )}
        </div>
      </main>

      {/* FOOTER */}
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
    </div>
  );
};

export default PdfReader;
