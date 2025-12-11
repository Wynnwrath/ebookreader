// src/components/BookComp/ReaderModal.jsx
import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function ReaderModal({ bookId, filePath, bookTitle , onClose }) {
  const [content, setContent] = useState("");  // EPUB HTML content
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const contentRef = useRef(null);

  // Load EPUB content
  useEffect(() => {
    let mounted = true;

    async function fetchBookContent() {
      setLoading(true);
      setError(null);

      try {
        const htmlContent = await invoke("read_epub", { path: filePath });
        if (!mounted) return;
        setContent(htmlContent);
      } catch (err) {
        console.error("Failed to read EPUB:", err);
        if (!mounted) return;
        setError("Failed to load book content.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchBookContent();

    return () => {
      mounted = false;
    };
  }, [filePath]);

  // Handle internal anchor/chapter links
  useEffect(() => {
    if (!contentRef.current) return;

    const container = contentRef.current;

    const handleLinkClick = (e) => {
      const target = e.target.closest("a[href^='#']");
      if (!target) return;

      e.preventDefault();
      const id = target.getAttribute("href").slice(1);
      const el = container.querySelector(`#${id}`);
      if (el) {
        container.scrollTo({
          top: el.offsetTop,
          behavior: "smooth",
        });
      }
    };

    container.addEventListener("click", handleLinkClick);
    return () => container.removeEventListener("click", handleLinkClick);
  }, [content]);

  return (
    <>
      {/* Full-screen semi-transparent overlay */}
      <div className="fixed inset-0 bg-black/40 z-[80]" />

      {/* Reader wrapper */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden">
        {/* Left blur */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 bg-black/30 backdrop-blur-md" />

        {/* Main reader panel */}
        <div className="relative flex-1 max-w-6xl h-full bg-black text-white shadow-2xl rounded-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-black/20 border-b border-white/10">
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">Reading</span>
              <span className="text-base sm:text-lg font-semibold truncate">
                {bookTitle || "Current book"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs sm:text-sm text-gray-200 border border-white/20"
            >
              Close
            </button>
          </div>

          {/* Scrollable content */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-6 py-6 text-gray-100 text-base sm:text-lg leading-relaxed"
            style={{ lineHeight: "1.6" }}
            dangerouslySetInnerHTML={{
              __html: loading
                ? "<p>Loading book...</p>"
                : error
                ? `<p class='text-red-400'>${error}</p>`
                : content,
            }}
          />

          {/* Optional footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-black/95 text-xs text-gray-300 text-center">
            {filePath}
          </div>
        </div>

        {/* Right blur */}
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 bg-black/30 backdrop-blur-md" />
      </div>
    </>
  );
}
