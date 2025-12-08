// src/components/BookComp/ReaderModal.jsx

import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
// When ready to connect to backend, uncomment:
// import { invoke } from "@tauri-apps/api/tauri";

import BookProgress from "./BookProgress";

export default function ReaderModal({
  bookId,
  currentPage,
  totalPages,
  onPageChange,
  onClose,
}) {
  const [content, setContent] = useState("Loading page...");

  // TEMP MOCK for now – backend will replace this
  useEffect(() => {
    console.log("[ReaderModal] Mounted/updated for book:", {
      bookId,
      currentPage,
      totalPages,
    });

    setContent(
      `This is TEMPORARY mock content for book ID: ${bookId}\n\n` +
        `You are currently on page ${currentPage} of ${totalPages}.\n\n` +
        `Plug in the backend tauri command here to fetch the actual page text from the file.`
    );

    // LATER: real example:
    // const text = await invoke("get_page", { bookId, pageNumber: currentPage });
    // setContent(text);
  }, [bookId, currentPage, totalPages]);

  const atFirst = currentPage <= 1;
  const atLast = totalPages > 0 && currentPage >= totalPages;

  const goPrev = () => {
    if (!onPageChange) return;
    if (atFirst) return;
    onPageChange(currentPage - 1);
  };

  const goNext = () => {
    if (!onPageChange) return;
    if (atLast) return;
    onPageChange(currentPage + 1);
  };

  return (
    <>
      {/* FULL-SCREEN OVERLAY + BLUR */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[80]" />

      {/* WRAPPER */}
      <div className="fixed inset-[10px] z-[90] flex items-center justify-center">
        {/* relative so side buttons can sit outside the main panel */}
        <div className="relative w-full h-full max-w-6xl flex items-center justify-center">
          {/* MAIN READER PANEL */}
          <div className="w-full h-full rounded-2xl bg-white/5 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/20 border-b border-white/10">
              <div className="flex flex-col">
                <span className="text-sm text-gray-300">Reading</span>
                <span className="text-base sm:text-lg font-semibold text-white truncate">
                  {bookId || "Current book"}
                </span>
              </div>

              <button
                onClick={onClose}
                className="
                  px-3 py-1.5 rounded-full 
                  bg-white/10 hover:bg-white/20 
                  text-xs sm:text-sm text-gray-200
                  border border-white/20
                "
              >
                Close
              </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-6 py-5 text-gray-100 text-sm sm:text-base whitespace-pre-wrap">
              {content}
            </div>

            {/* FOOTER – uses reusable BookProgress */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex justify-center">
              <BookProgress
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </div>
          </div>

          {/* PREVIOUS BUTTON – LEFT SIDE, VERTICALLY CENTERED */}
          <button
            onClick={goPrev}
            disabled={atFirst}
            className={`
              absolute left-[-2.8rem] top-1/2 -translate-y-1/2
              flex items-center justify-center
              w-11 h-11 sm:w-12 sm:h-12 rounded-full
              bg-white/10 hover:bg-white/20
              border border-white/20
              text-gray-100 shadow-lg
              transition
              ${atFirst ? "opacity-30 pointer-events-none" : ""}
            `}
          >
            <FaChevronLeft className="text-sm sm:text-base" />
          </button>

          {/* NEXT BUTTON – RIGHT SIDE, VERTICALLY CENTERED */}
          <button
            onClick={goNext}
            disabled={atLast}
            className={`
              absolute right-[-2.8rem] top-1/2 -translate-y-1/2
              flex items-center justify-center
              w-11 h-11 sm:w-12 sm:h-12 rounded-full
              bg-orange-500 hover:bg-orange-600
              text-white shadow-lg
              transition
              ${atLast ? "opacity-30 pointer-events-none hover:bg-orange-500" : ""}
            `}
          >
            <FaChevronRight className="text-sm sm:text-base" />
          </button>
        </div>
      </div>
    </>
  );
}
