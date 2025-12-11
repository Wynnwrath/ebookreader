import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import BookProgress from "./BookProgress";

export default function ReaderModal({ 
  bookId, 
  filePath, 
  bookTitle, 
  onClose,
  chapterAnchor // Added this prop so chapter clicks work
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

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

  // 2. Memoize HTML Object to prevent unnecessary DOM updates
  const rawHtml = useMemo(() => ({
    __html: loading
      ? "<div class='text-center py-20 opacity-50'>Loading book content...</div>"
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
        // Avoid division by zero
        if (scrollHeight > clientHeight) {
          const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
          setProgress(scrollPercent);
        }
      }
      scrollTimeout.current = null;
    }, 100);
  }, []);

  // 4. Handle Internal Links & Chapter Anchors
  useEffect(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;

    // A. Handle link clicks inside the book
    const handleLinkClick = (e) => {
      const target = e.target.closest("a[href^='#']");
      if (!target) return;
      e.preventDefault();
      const id = target.getAttribute("href").slice(1);
      const el = container.querySelector(`#${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    };

    container.addEventListener("click", handleLinkClick);

    // B. Handle initial chapter jump (if provided)
    if (chapterAnchor && !loading && content) {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        const el = container.querySelector(`#${chapterAnchor}`);
        if (el) el.scrollIntoView({ behavior: "auto" });
      }, 100);
    }

    return () => container.removeEventListener("click", handleLinkClick);
  }, [content, loading, chapterAnchor]);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />

        <div className="pointer-events-auto relative w-full max-w-5xl h-[90vh] bg-[#1a1a1a] text-white shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-white/10 animate-pop-in">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#252525] border-b border-white/5 shrink-0">
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Reading</span>
              <span className="text-lg font-medium truncate text-gray-100 max-w-md">
                {bookTitle || "Untitled"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors border border-white/10"
            >
              Close
            </button>
          </div>

          {/* Scrollable Content Area 
              REMOVED 'scroll-smooth' from here to prevent fighting with programmatic updates
          */}
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-8 py-8 md:px-16 text-gray-200 text-lg leading-relaxed custom-scrollbar"
            style={{ fontFamily: 'Georgia, serif' }} 
            dangerouslySetInnerHTML={rawHtml}
          />

          {/* Footer with Progress Bar */}
          <div className="px-8 py-3 bg-[#252525] border-t border-white/5 shrink-0">
            <BookProgress progress={progress} className="w-full max-w-xl mx-auto" />
            <p className="text-[10px] text-center text-gray-500 mt-1 font-mono opacity-50 truncate">
              {filePath}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}