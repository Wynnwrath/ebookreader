import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MdOutlineLightMode, MdOutlineDarkMode, MdClose } from "react-icons/md"; 
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
  const [isDarkMode, setIsDarkMode] = useState(true);

  const contentRef = useRef(null);
  const scrollTimeout = useRef(null);

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

  const rawHtml = useMemo(() => ({
    __html: loading
      ? `<div class='text-center py-20 opacity-50'>Loading book content...</div>`
      : error
      ? `<div class='text-red-400 text-center py-20'>${error}</div>`
      : content
  }), [loading, error, content]);

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

  useEffect(() => {
    if (!loading && content && contentRef.current) {
      setTimeout(() => {
        const el = contentRef.current;
        if (!el) return;
        if (chapterAnchor) {
          let target = el.querySelector(`#${chapterAnchor}`);
          if (!target) target = el.querySelector(`[name="${chapterAnchor}"]`);
          if (target) {
            target.scrollIntoView({ behavior: "auto", block: "start" });
            return; 
          }
        }
        if (initialProgress > 0) {
          const { scrollHeight, clientHeight } = el;
          const scrollPos = (initialProgress / 100) * (scrollHeight - clientHeight);
          el.scrollTo({ top: scrollPos, behavior: 'auto' });
        }
      }, 200); 
    }
  }, [loading, content, chapterAnchor, initialProgress]);

  const handleClose = () => {
    if (bookId) {
      localStorage.setItem(`book_progress_${bookId}`, progress.toString());
    }
    onClose(); 
  };

  useEffect(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;
    const handleLinkClick = (e) => {
      const target = e.target.closest("a");
      if (!target) return;
      e.preventDefault();
      const href = target.getAttribute("href");
      if (!href) return;
      let id = href.includes("#") ? href.split("#")[1] : href.replace(/\.[^/.]+$/, "");
      const el = container.querySelector(`#${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };
    container.addEventListener("click", handleLinkClick);
    return () => container.removeEventListener("click", handleLinkClick);
  }, [content, loading]);

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-[80] backdrop-blur-sm" onClick={handleClose} />

      <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
        
        {isDarkMode && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />
          </>
        )}

        <div className={`
            pointer-events-auto relative w-full max-w-5xl h-[95vh] 
            shadow-2xl rounded-2xl flex flex-col overflow-hidden 
            animate-pop-in transition-colors duration-300
            ${isDarkMode 
              ? "bg-bg text-text border border-border" 
              : "bg-[#fdfdfd] text-gray-900 border border-gray-200"
            }
          `}
        >
          {/* Header */}
          <div className={`
            flex items-center justify-between px-6 py-4 border-b shrink-0 transition-colors duration-300
            ${isDarkMode 
              ? "bg-header border-border" 
              : "bg-gray-100 border-gray-200"
            }
          `}>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Reading</span>
              <span className={`text-lg font-medium truncate max-w-md ${isDarkMode ? "text-text" : "text-gray-800"}`}>
                {bookTitle || "Untitled"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors border ${isDarkMode ? "bg-glass hover:bg-white/10 border-border text-primary" : "bg-white hover:bg-gray-200 border-gray-300 text-gray-600"}`}>
                {isDarkMode ? <MdOutlineLightMode size={20} /> : <MdOutlineDarkMode size={20} />}
              </button>
              <button onClick={handleClose} className={`px-4 py-1.5 rounded-full text-sm transition-colors border flex items-center gap-1 ${isDarkMode ? "bg-glass hover:bg-white/10 text-text border-border" : "bg-white hover:bg-gray-200 text-gray-700 border-gray-300"}`}>
                <span>Close</span>
                <MdClose />
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className={`
              flex-1 overflow-y-auto px-8 py-8 md:px-16 text-lg leading-relaxed custom-scrollbar transition-colors duration-300 
              ${isDarkMode ? "text-text" : "text-gray-900"}
            `}
            style={{ fontFamily: 'Georgia, serif' }} 
            dangerouslySetInnerHTML={rawHtml}
          />

          {/* Footer */}
          <div className={`px-8 py-3 border-t shrink-0 transition-colors duration-300 ${isDarkMode ? "bg-header border-border" : "bg-gray-100 border-gray-200"}`}>
            <BookProgress progress={progress} className="w-full max-w-xl mx-auto" />
            <p className={`text-[10px] text-center mt-1 font-mono opacity-50 truncate ${isDarkMode ? "text-text-dim" : "text-gray-400"}`}>
              {filePath}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}