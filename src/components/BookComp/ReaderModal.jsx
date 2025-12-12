import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MdOutlineLightMode, MdOutlineDarkMode, MdClose } from "react-icons/md"; // Added icons
import BookProgress from "./BookProgress";

export default function ReaderModal({ 
  bookId, 
  filePath, 
  bookTitle, 
  onClose,
  initialProgress = 0, 
  chapterAnchor 
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(initialProgress); 
  
  // --- NEW: Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(true);

  const contentRef = useRef(null);
  const scrollTimeout = useRef(null);

  // 1. Fetch EPUB Content
  useEffect(() => {
    let mounted = true;

    async function fetchBookContent() {
      setLoading(true);
      setError(null);
      try {
        const htmlContent = await invoke("read_epub", { path: filePath });
        if (mounted) setContent(htmlContent);
      } catch (err) {
        console.error("Failed to read EPUB:", err);
        if (mounted) setError("Failed to load book content.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (filePath) fetchBookContent();

    return () => { mounted = false; };
  }, [filePath]);

  // 2. Memoize HTML
  const rawHtml = useMemo(() => ({
    __html: loading
      ? `<div class='text-center py-20 opacity-50'>Loading book content...</div>`
      : error
      ? `<div class='text-red-400 text-center py-20'>${error}</div>`
      : content
  }), [loading, error, content]);

  // 3. Handle Scroll (Throttled)
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    if (scrollTimeout.current) return;

    scrollTimeout.current = setTimeout(() => {
      const el = contentRef.current;
      if (el) {
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollHeight > clientHeight) {
          const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
          setProgress(scrollPercent);
        }
      }
      scrollTimeout.current = null;
    }, 100);
  }, []);

  // 4. RESTORE SCROLL POSITION
  useEffect(() => {
    if (!loading && content && contentRef.current && initialProgress > 0) {
      setTimeout(() => {
        const el = contentRef.current;
        if (el) {
          const { scrollHeight, clientHeight } = el;
          const scrollPos = (initialProgress / 100) * (scrollHeight - clientHeight);
          el.scrollTo({ top: scrollPos, behavior: 'auto' });
        }
      }, 100);
    }
  }, [loading, content, initialProgress]);

  // 5. Handle Close
  const handleClose = () => {
    if (bookId) {
      const storageKey = `book_progress_${bookId}`;
      localStorage.setItem(storageKey, progress.toString());
      console.log(`Saved progress for book ${bookId}: ${progress.toFixed(2)}%`);
    }
    onClose(); 
  };

  // 6. Handle Links
  useEffect(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;

    const handleLinkClick = (e) => {
      const target = e.target.closest("a[href^='#']");
      if (!target) return;
      e.preventDefault();
      const id = target.getAttribute("href").slice(1);
      const el = container.querySelector(`#${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    container.addEventListener("click", handleLinkClick);

    if (chapterAnchor && !loading && content) {
      setTimeout(() => {
        const el = container.querySelector(`#${chapterAnchor}`);
        if (el) el.scrollIntoView({ behavior: "auto" });
      }, 150);
    }

    return () => container.removeEventListener("click", handleLinkClick);
  }, [content, loading, chapterAnchor]);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm" onClick={handleClose} />

      <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
        {/* Side Gradients (Only visible in Dark Mode for immersion) */}
        {isDarkMode && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />
          </>
        )}

        {/* === MAIN MODAL CONTAINER === */}
        <div 
          className={`
            pointer-events-auto relative w-full max-w-5xl h-[95vh] 
            shadow-2xl rounded-2xl flex flex-col overflow-hidden 
            animate-pop-in transition-colors duration-300
            ${isDarkMode 
              ? "bg-[#1a1a1a] text-white border border-white/10" 
              : "bg-[#fdfdfd] text-gray-900 border border-gray-200"
            }
          `}
        >
          
          {/* === HEADER === */}
          <div 
            className={`
              flex items-center justify-between px-6 py-4 border-b shrink-0 transition-colors duration-300
              ${isDarkMode 
                ? "bg-[#252525] border-white/5" 
                : "bg-gray-100 border-gray-200"
              }
            `}
          >
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Reading</span>
              <span className={`text-lg font-medium truncate max-w-md ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                {bookTitle || "Untitled"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* --- LIGHT/DARK TOGGLE BUTTON --- */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`
                  p-2 rounded-full transition-colors border
                  ${isDarkMode
                    ? "bg-white/5 hover:bg-white/10 border-white/10 text-yellow-400"
                    : "bg-white hover:bg-gray-200 border-gray-300 text-gray-600"
                  }
                `}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <MdOutlineLightMode size={20} /> : <MdOutlineDarkMode size={20} />}
              </button>

              <button
                onClick={handleClose}
                className={`
                  px-4 py-1.5 rounded-full text-sm transition-colors border flex items-center gap-1
                  ${isDarkMode 
                    ? "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10" 
                    : "bg-white hover:bg-gray-200 text-gray-700 border-gray-300"
                  }
                `}
              >
                <span>Close</span>
                <MdClose />
              </button>
            </div>
          </div>

          {/* === CONTENT AREA === */}
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className={`
              flex-1 overflow-y-auto px-8 py-8 md:px-16 text-lg leading-relaxed custom-scrollbar transition-colors duration-300
              ${isDarkMode ? "text-gray-200" : "text-gray-900"}
            `}
            style={{ fontFamily: 'Georgia, serif' }} 
            dangerouslySetInnerHTML={rawHtml}
          />

          {/* === FOOTER === */}
          <div 
            className={`
              px-8 py-3 border-t shrink-0 transition-colors duration-300
              ${isDarkMode 
                ? "bg-[#252525] border-white/5" 
                : "bg-gray-100 border-gray-200"
              }
            `}
          >
            <BookProgress progress={progress} className="w-full max-w-xl mx-auto" />
            <p className={`text-[10px] text-center mt-1 font-mono opacity-50 truncate ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              {filePath}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}