import { useState, useEffect } from "react";
import BookCard from "./BookCard";
import { SlArrowRight, SlArrowLeft } from "react-icons/sl";

/**
 * BookSlider Component
 * - Displays a horizontal, paginated carousel of books.
 * - Accepts an optional `onBookClick(book)` callback so parents
 *   can handle navigation or backend actions (e.g., open reader).
 */
export default function BookSlider({ books = [], title, onBookClick }) {
  // Current page index of the slider
  const [currentPage, setCurrentPage] = useState(0);

  // How many books are visible at once depending on screen size
  const [visibleCount, setVisibleCount] = useState(10);

  // Adjust visible book count when the window is resized
  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 640) setVisibleCount(2); // Mobile view
      else if (window.innerWidth < 1024) setVisibleCount(4); // Tablet view
      else setVisibleCount(10); // Desktop view
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);

    // Cleanup on unmount
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  // Calculate total pagination pages
  const totalPages =
    visibleCount > 0 ? Math.ceil(books.length / visibleCount) : 0;

  // Ensure currentPage is within bounds when books/visibleCount change
  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(0);
      return;
    }

    setCurrentPage((prev) => {
      if (prev >= totalPages) return totalPages - 1;
      if (prev < 0) return 0;
      return prev;
    });
  }, [totalPages]);

  // Determine which books should be displayed for the current page
  const startIndex = currentPage * visibleCount;
  const visibleBooks = books.slice(startIndex, startIndex + visibleCount);

  // Navigate forward with looping (only if more than 1 page)
  const handleNext = () => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  // Navigate backward with looping (only if more than 1 page)
  const handlePrev = () => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // Handle book clicks and forward to parent if provided
  const handleBookClick = (book) => {
    if (onBookClick) {
      onBookClick(book);
    } else {
      console.log("[BookSlider] Clicked book:", book);
    }
  };

  return (
    <div className="relative w-full h-full p-6 pt-0">
      {/* Header section with title and navigation controls */}
      <div className="flex justify-between items-center px-10 mb-4">
        {title && (
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            {title}
          </h2>
        )}

        {/* Navigation arrows */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            className="w-9 h-9 sm:w-10 sm:h-10 
                       bg-gradient-to-br from-orange-500/60 to-violet-600/60 
                       text-white rounded-full flex items-center justify-center 
                       hover:from-orange-500 hover:to-violet-600 hover:scale-105 
                       transition-all duration-300 shadow-[0_0_10px_rgba(255,153,51,0.4)]"
          >
            <SlArrowLeft size={18} />
          </button>

          <button
            onClick={handleNext}
            className="w-9 h-9 sm:w-10 sm:h-10 
                       bg-gradient-to-br from-orange-500/60 to-violet-600/60 
                       text-white rounded-full flex items-center justify-center 
                       hover:from-orange-500 hover:to-violet-600 hover:scale-105 
                       transition-all duration-300 shadow-[0_0_10px_rgba(255,153,51,0.4)]"
          >
            <SlArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Row of currently visible books */}
      <div className="flex gap-2 sm:gap-4 overflow-hidden px-10">
        {visibleBooks.map((book, index) => (
          <BookCard
            key={index}
            {...book}
            onClick={handleBookClick} // forward clicks up with full book info
          />
        ))}
      </div>
    </div>
  );
}
