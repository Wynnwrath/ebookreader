import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { 
  FiMenu, 
  FiSettings, 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronUp,
  FiChevronDown,
  FiArrowLeft,
  FiBookmark,
  FiRotateCcw,
  FiBookOpen,
  FiX,
  FiList,
  FiHeart
} from "react-icons/fi";
import { tauriService } from "../services/tauriService";
import { BookDetails, Chapter, Bookmark, ProgressInfo } from "../types";
import SettingsModal from "../components/SettingsModal";

interface BookOutletContext {
  userId: number | null;
}

interface BookPageProps {
  userId?: number | null;
}

const BookPage: React.FC<BookPageProps> = ({ userId: propUserId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const context = useOutletContext<BookOutletContext | null>();
  const userId = propUserId ?? context?.userId ?? 1;

  // References
  const readerRef = useRef<HTMLDivElement>(null);
  const lastNavTimeRef = useRef<number>(0);

  // State Management
  const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLeftHovered, setIsLeftHovered] = useState<boolean>(false);
  const [isRightHovered, setIsRightHovered] = useState<boolean>(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("stellaron-reader-font-size");
    return saved ? parseInt(saved, 10) : 18;
  }); // in px
  const [lineHeight, setLineHeight] = useState<number>(() => {
    const saved = localStorage.getItem("stellaron-reader-line-height");
    return saved ? parseFloat(saved) : 1.6;
  });
  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem("stellaron-reader-font-family") || "font-serif";
  }); // "font-serif" | "font-sans" | "font-mono"
  const [readerTheme, setReaderTheme] = useState<string>(() => {
    return localStorage.getItem("stellaron-reader-theme") || "dark";
  }); // "dark" | "cream" | "sepia"
  const [activeChapter, setActiveChapter] = useState<string>("Beginning");
  const [loading, setLoading] = useState<boolean>(true);
  const [targetScroll, setTargetScroll] = useState<number | null>(null);

  const [pdfPageData, setPdfPageData] = useState<string | null>(null);
  const [pdfPageLoading, setPdfPageLoading] = useState<boolean>(false);

  const [readerLayoutMode, setReaderLayoutMode] = useState<"classic" | "redesign">(() => {
    return (localStorage.getItem("stellaron-reader-layout") as "classic" | "redesign") || "redesign";
  });

  const getPageScrollStep = (container: HTMLDivElement): number => {
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
  };

  const toggleReaderLayout = () => {
    const next = readerLayoutMode === "classic" ? "redesign" : "classic";
    setReaderLayoutMode(next);
    localStorage.setItem("stellaron-reader-layout", next);
    // Reset page index on change
    setCurrentPage(1);
    if (readerRef.current) {
      readerRef.current.scrollLeft = 0;
      readerRef.current.scrollTop = 0;
    }
  };

  const stateRef = useRef({ activeChapter, currentPage });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = { activeChapter, currentPage };
  }, [activeChapter, currentPage]);

  const navigatePage = useCallback((direction: "prev" | "next") => {
    if (bookDetails?.file_type === "pdf") {
      if (direction === "prev") {
        setCurrentPage(prev => Math.max(1, prev - 1));
      } else {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
      }
      return;
    }

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
  }, [bookDetails, totalPages, readerLayoutMode]);

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
        // Classic mode: scroll up/down
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

  // Load Book details and content
  const loadBook = async () => {
    try {
      setLoading(true);
      const book = await tauriService.getBookDetails(Number(id));
      if (!book) {
        console.error("Book details not found");
        return;
      }
      setBookDetails(book);

      // Check favorite status
      const savedFavs = localStorage.getItem(`stellaron-favorites-${userId}`);
      if (savedFavs) {
        const favArray: number[] = JSON.parse(savedFavs);
        setIsFavorite(favArray.includes(book.id));
      }

      // Fetch cover image
      try {
        const coverBytes = await tauriService.getCoverImg(book.id);
        if (coverBytes && coverBytes.length > 0) {
          const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
          setCoverUrl(URL.createObjectURL(blob));
        }
      } catch (e) {
        console.warn("Failed to load cover image:", e);
      }

      if (book.file_type === "pdf") {
        try {
          const pageCount = await tauriService.getPdfPageCount(book.file_path);
          setTotalPages(pageCount);

          const parsedChaps: Chapter[] = [];
          for (let i = 1; i <= pageCount; i++) {
            parsedChaps.push({
              title: `Page ${i}`,
              id: `page-${i}`,
              elementTop: 0
            });
          }
          setChapters(parsedChaps);
          setHtmlContent("");
          await loadProgressAndBookmarks(book.id);
        } catch (err) {
          console.error("Failed to load PDF metadata:", err);
        }
      } else {
        const content = await tauriService.readEpub(book.file_path);
        
        // Parse content and extract chapters
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        // Strip global style tags from EPUB body to prevent global style overrides
        doc.querySelectorAll("style").forEach(el => el.remove());

        // Strip inline styles setting background-color, background, or text color
        doc.body.removeAttribute("style");
        doc.querySelectorAll("*").forEach(el => {
          const styleAttr = el.getAttribute("style");
          if (styleAttr) {
            const cleaned = styleAttr
              .replace(/background-color\s*:\s*[^;]+;?/gi, "")
              .replace(/background\s*:\s*[^;]+;?/gi, "")
              .replace(/color\s*:\s*[^;]+;?/gi, "");
            if (cleaned.trim() === "") {
              el.removeAttribute("style");
            } else {
              el.setAttribute("style", cleaned);
            }
          }
        });

        const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6, [class*='chapter'], [id*='chapter']"));
        
        const chaps: Chapter[] = headings.map((h, idx) => {
          if (!h.id) {
            h.id = `chapter-heading-${idx}`;
          }
          return {
            title: h.textContent?.trim() || `Section ${idx + 1}`,
            id: h.id,
            elementTop: 0
          };
        }).filter(c => c.title.length > 0 && c.title.length < 100);

        setChapters(chaps);
        setHtmlContent(doc.body.innerHTML);

        // Load progress and bookmarks
        await loadProgressAndBookmarks(book.id);
      }

    } catch (err) {
      console.error("Failed to load book content, using mock fallback:", err);
      // Fallback mock book for development/browser-testing
      const mockBook: BookDetails = {
        id: Number(id),
        title: "Five Fall Into Adventure",
        author: "Enid Blyton",
        file_path: "mock_adventure.epub",
        file_type: "epub"
      };
      setBookDetails(mockBook);
      setChapters([
        { title: "Chapter 1: A Surprise Visitor", id: "chap-1", elementTop: 0 },
        { title: "Chapter 2: The Adventure Begins", id: "chap-2", elementTop: 0 },
        { title: "Chapter 3: Escape in the Dark", id: "chap-3", elementTop: 0 }
      ]);
      setHtmlContent(`
        <h1 id="chap-1" class="text-2xl font-bold mb-4">Chapter 1: A Surprise Visitor</h1>
        <p class="mb-4">It was a lovely sunny afternoon when the children arrived at Kirrin Cottage. Uncle Quentin was busy in his study, and Aunt Fanny welcomed them with a warm plate of homemade scones.</p>
        <p class="mb-4">George and Timmy were already waiting by the gate, their eyes bright with excitement. "I've heard some strange stories about the old castle," George whispered. "The fishermen say someone has been lighting fires in the tower at night."</p>
        <p class="mb-4">Julian, Dick, and Anne looked at each other. They knew that whenever George mentioned strange stories, an adventure was never far behind. "We must go and inspect it tomorrow," Julian said, his voice full of resolve.</p>
        
        <h1 id="chap-2" class="text-2xl font-bold mt-8 mb-4">Chapter 2: The Adventure Begins</h1>
        <p class="mb-4">The next morning they set off early in their small rowboat, the waves gently lapping against the wooden hull. Timmy stood proudly at the bow, his tail wagging like a metronome.</p>
        <p class="mb-4">As they drew closer to the island, the dark ruins of the castle loomed high above them. The air felt cold, and a strange silence hung over the stone walls. Anne shivered slightly. "Do you think we should turn back?" she asked.</p>
        <p class="mb-4">"Nonsense!" said George. "We're almost there. Timmy will protect us." Timmy let out a soft bark of agreement.</p>

        <h1 id="chap-3" class="text-2xl font-bold mt-8 mb-4">Chapter 3: Escape in the Dark</h1>
        <p class="mb-4">Night had fallen quickly, wrapping the island in a thick blanket of fog. The children were huddled together inside the ruined dungeons, listening to the wind howling through the cracks.</p>
        <p class="mb-4">Suddenly, Timmy growled. A heavy footstep echoed down the stone corridor. Julian held his breath, raising his lantern slightly. "Who's there?" he called out, his heart pounding.</p>
        <p class="mb-4">There was no answer, only the sound of hurried footsteps running away. "After them!" George cried, and they dashed out into the dark night, embarking on the escape of their lives.</p>
      `);
      setIsFavorite(false);
      // Wait for a render tick and set total pages to 3
      setTimeout(() => {
        setTotalPages(3);
      }, 50);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    if (!bookDetails) return;
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

  const loadProgressAndBookmarks = async (bookId: number) => {
    try {
      const prog = await tauriService.getReadingProgress<ProgressInfo>({ userId, bookId });
      const bmarks = await tauriService.getBookmarks({ userId, bookId });
      setBookmarks(bmarks || []);

      if (prog && prog.current_position) {
        setTargetScroll(parseFloat(prog.current_position));
      } else {
        setTargetScroll(0);
      }
    } catch (e) {
      console.error("Failed to fetch progress/bookmarks:", e);
    }
  };

  // Safe scroll restoration effect running after HTML content is mounted in layout
  useEffect(() => {
    if (bookDetails?.file_type === "pdf") {
      if (targetScroll !== null) {
        const initialPg = Math.max(1, Math.min(totalPages, Math.round(targetScroll) || 1));
        setCurrentPage(initialPg);
        setActiveChapter(`Page ${initialPg}`);
      }
      return;
    }

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
  }, [htmlContent, targetScroll, readerLayoutMode, location.state, bookDetails, totalPages]);

  // Fetch PDF Page data
  useEffect(() => {
    const fetchPdfPage = async () => {
      if (!bookDetails || bookDetails.file_type !== "pdf") return;
      try {
        setPdfPageLoading(true);
        const page = await tauriService.readPdfPage(
          bookDetails.file_path, 
          currentPage - 1 
        );
        setPdfPageData(page.image_data);
      } catch (err) {
        console.error("Failed to read PDF page:", err);
      } finally {
        setPdfPageLoading(false);
      }
    };
    fetchPdfPage();
  }, [currentPage, bookDetails]);

  // PDF reading progress auto-save
  useEffect(() => {
    if (!bookDetails || bookDetails.file_type !== "pdf" || !userId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const progressPercent = totalPages > 1 ? ((currentPage - 1) / (totalPages - 1)) * 100 : 0;
      try {
        await tauriService.updateReadingProgress({
          userId,
          bookId: bookDetails.id,
          currentPosition: String(currentPage),
          chapterTitle: `Page ${currentPage}`,
          pageNumber: currentPage,
          progressPercentage: progressPercent
        });
      } catch (e) {
        console.error("Failed to auto-save PDF progress:", e);
      }
    }, 1000);
  }, [currentPage, bookDetails, userId, totalPages]);

  useEffect(() => {
    if (userId && id) {
      loadBook();
    }
  }, [userId, id]);

  const handleScroll = () => {
    if (bookDetails?.file_type === "pdf") return;
    updatePaginationInfo();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const container = readerRef.current;
      if (!container || !bookDetails || !userId) return;

      let progressPercent = 0;
      let positionVal = "0";

      if (readerLayoutMode === "redesign") {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        progressPercent = scrollWidth > clientWidth 
          ? (scrollLeft / (scrollWidth - clientWidth)) * 100 
          : 0;
        positionVal = String(scrollLeft);
      } else {
        const { scrollTop, scrollHeight, clientHeight } = container;
        progressPercent = scrollHeight > clientHeight 
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
          progressPercentage: progressPercent
        });
      } catch (e) {
        console.error("Failed to auto-save progress:", e);
      }
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updatePaginationInfo = () => {
    if (bookDetails?.file_type === "pdf") return;
    const container = readerRef.current;
    if (!container) return;

    if (readerLayoutMode === "redesign") {
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

      const estimatedTotal = Math.max(1, Math.ceil((scrollWidth - paddingLeft - paddingRight + columnGap) / step));
      const estimatedCurrent = Math.min(estimatedTotal, Math.max(1, Math.round(scrollLeft / step) + 1));
      setTotalPages(estimatedTotal);
      setCurrentPage(estimatedCurrent);
    } else {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const estimatedTotal = Math.max(1, Math.ceil(scrollHeight / clientHeight));
      const estimatedCurrent = Math.min(estimatedTotal, Math.max(1, Math.ceil(scrollTop / clientHeight) + 1));
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
          if (readerLayoutMode === "redesign") {
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
    }
  };

  const handleChapterClick = (chapterId: string) => {
    if (bookDetails?.file_type === "pdf") {
      if (chapterId.startsWith("page-")) {
        const pgNum = parseInt(chapterId.replace("page-", ""), 10);
        if (!isNaN(pgNum)) {
          setCurrentPage(pgNum);
          setActiveChapter(`Page ${pgNum}`);
        }
      }
      setIsLeftHovered(false);
      return;
    }
    const container = readerRef.current;
    if (!container) return;
    const el = container.querySelector(`#${chapterId}`);
    if (el) {
      if (readerLayoutMode === "redesign") {
        const containerLeft = container.getBoundingClientRect().left;
        const elementLeft = el.getBoundingClientRect().left;
        container.scrollBy({ left: elementLeft - containerLeft, behavior: "smooth" });
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsLeftHovered(false);
  };

  const handleBookmarkToggle = async () => {
    if (!bookDetails) return;

    if (bookDetails.file_type === "pdf") {
      const existing = bookmarks.find(b => parseInt(b.position, 10) === currentPage);
      try {
        if (existing) {
          await tauriService.deleteBookmark(existing.bookmark_id);
        } else {
          await tauriService.addBookmark({
            userId,
            bookId: bookDetails.id,
            position: String(currentPage),
            chapterTitle: `Page ${currentPage}`,
            pageNumber: currentPage
          });
        }
        const bmarks = await tauriService.getBookmarks({ userId, bookId: bookDetails.id });
        setBookmarks(bmarks || []);
      } catch (e) {
        console.error("Failed to toggle PDF bookmark:", e);
      }
      return;
    }

    if (!readerRef.current) return;
    const container = readerRef.current;
    const scrollPos = readerLayoutMode === "redesign" ? container.scrollLeft : container.scrollTop;

    const threshold = 150;
    const existing = bookmarks.find(b => Math.abs(parseFloat(b.position) - scrollPos) < threshold);

    try {
      if (existing) {
        await tauriService.deleteBookmark(existing.bookmark_id);
      } else {
        await tauriService.addBookmark({
          userId,
          bookId: bookDetails.id,
          position: String(scrollPos),
          chapterTitle: activeChapter,
          pageNumber: currentPage
        });
      }
      const bmarks = await tauriService.getBookmarks({ userId, bookId: bookDetails.id });
      setBookmarks(bmarks || []);
    } catch (e) {
      console.error("Failed to toggle bookmark:", e);
    }
  };

  const handleBookmarkClick = (position: string) => {
    if (bookDetails?.file_type === "pdf") {
      const pgNum = parseInt(position, 10);
      if (!isNaN(pgNum)) {
        setCurrentPage(pgNum);
        setActiveChapter(`Page ${pgNum}`);
      }
      setIsRightHovered(false);
      return;
    }

    if (readerRef.current) {
      if (readerLayoutMode === "redesign") {
        readerRef.current.scrollTo({ left: parseFloat(position), behavior: "smooth" });
      } else {
        readerRef.current.scrollTo({ top: parseFloat(position), behavior: "smooth" });
      }
      updatePaginationInfo();
    }
    setIsRightHovered(false);
  };

  const isBookmarked = () => {
    if (bookDetails?.file_type === "pdf") {
      return bookmarks.some(b => parseInt(b.position, 10) === currentPage);
    }
    if (!readerRef.current) return false;
    const scrollPos = readerLayoutMode === "redesign" ? readerRef.current.scrollLeft : readerRef.current.scrollTop;
    return bookmarks.some(b => Math.abs(parseFloat(b.position) - scrollPos) < 150);
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
    // Default dark theme matching scholarly-dark
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
    return "leading-relaxed"; // 1.6
  };

  const getPercentage = () => {
    if (totalPages <= 1) return 0;
    return Math.round(((currentPage - 1) / (totalPages - 1)) * 100);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-bg text-on-surface-variant text-sm font-semibold">
        Loading e-book contents...
      </div>
    );
  }

  return (
    <div 
      style={getThemeStyles()}
      className={`fixed inset-0 flex overflow-hidden ${getThemeClasses()} selection:bg-tertiary/20 selection:text-tertiary`}
    >
      
      {/* Texture Overlay (always present in redesign mode for scholarly feel) */}
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
        {/* Book Header info in Drawer */}
        {bookDetails && (
          <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4 mb-4">
            <div className="w-10 h-14 bg-surface-container rounded shadow-sm border border-outline-variant/10 flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
              {coverUrl ? (
                <img src={coverUrl} alt={bookDetails.title} className="w-full h-full object-cover animate-fade-in" />
              ) : (
                "EPUB"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-xs font-bold text-on-surface truncate leading-tight">{bookDetails.title}</h3>
              <p className="text-[10px] text-on-surface-variant truncate mt-1">{bookDetails.author || "Unknown Author"}</p>
            </div>
          </div>
        )}

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
        {/* Book Header info in Drawer */}
        {bookDetails && (
          <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4 mb-4">
            <div className="w-10 h-14 bg-surface-container rounded shadow-sm border border-outline-variant/10 flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
              {coverUrl ? (
                <img src={coverUrl} alt={bookDetails.title} className="w-full h-full object-cover animate-fade-in" />
              ) : (
                "EPUB"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-xs font-bold text-on-surface truncate leading-tight">{bookDetails.title}</h3>
              <p className="text-[10px] text-on-surface-variant truncate mt-1">{bookDetails.author || "Unknown Author"}</p>
            </div>
          </div>
        )}

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

      {/* Floating Prev/Up Button (Left Vertically Centered) */}
      <button
        onClick={() => navigatePage("prev")}
        disabled={currentPage === 1}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-highest/85 backdrop-blur-md border border-outline-variant/20 shadow-lg text-on-surface hover:text-tertiary disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title={readerLayoutMode === "redesign" ? "Previous Page" : "Scroll Up"}
      >
        {readerLayoutMode === "redesign" ? (
          <FiChevronLeft className="w-6 h-6" />
        ) : (
          <FiChevronUp className="w-6 h-6" />
        )}
      </button>

      {/* Floating Next/Down Button (Right Vertically Centered) */}
      <button
        onClick={() => navigatePage("next")}
        disabled={currentPage === totalPages}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-highest/85 backdrop-blur-md border border-outline-variant/20 shadow-lg text-on-surface hover:text-tertiary disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title={readerLayoutMode === "redesign" ? "Next Page" : "Scroll Down"}
      >
        {readerLayoutMode === "redesign" ? (
          <FiChevronRight className="w-6 h-6" />
        ) : (
          <FiChevronDown className="w-6 h-6" />
        )}
      </button>

      {/* 2. TOP BAR (ALWAYS VISIBLE) */}
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
            {bookDetails?.title}
          </span>
          <span className="text-xs text-on-surface-variant truncate hidden md:inline">
            &bull; {activeChapter}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Reader layout toggler */}
          {bookDetails?.file_type !== "pdf" && (
            <button
              onClick={toggleReaderLayout}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-outline-variant/20 hover:border-tertiary/40 bg-surface-container/30 hover:bg-surface-container-high transition flex items-center gap-1.5 cursor-pointer text-on-surface"
            >
              <FiBookOpen className="w-3.5 h-3.5 text-tertiary" />
              <span>{readerLayoutMode === "redesign" ? "Paginated Mode" : "Scrollable Mode"}</span>
            </button>
          )}

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
            onClick={handleBookmarkToggle}
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

      {/* Settings Modal component overlay */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        initialTab="reader" 
        readerSettings={{ 
          fontSize, 
          setFontSize, 
          lineHeight, 
          setLineHeight, 
          fontFamily, 
          setFontFamily, 
          readerTheme, 
          setReaderTheme, 
          readerLayoutMode, 
          setReaderLayoutMode 
        }} 
      />

      {/* 3. FLUID READER CONTENT CANVAS */}
      <main 
        ref={readerRef}
        onScroll={handleScroll}
        onMouseEnter={() => {
          setIsLeftHovered(false);
          setIsRightHovered(false);
          setIsHeaderHovered(false);
        }}
        className={`flex-1 no-scrollbar transition-all duration-300 w-full h-full ${
          readerLayoutMode === "redesign" 
            ? "flex items-center overflow-y-hidden overflow-x-auto py-16 px-12 md:py-20 md:px-24" 
            : "overflow-y-auto py-24 px-6 max-w-3xl mx-auto"
        }`}
      >
        {bookDetails?.file_type === "pdf" ? (
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
        ) : (
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
            {/* Custom style injection for CSS-based dropcap */}
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
            />
          </article>
        )}
      </main>

      {/* 4. BOTTOM PROGRESS BAR */}
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
          {/* Footer Details Content */}
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

export default BookPage;
