import { useState, useEffect } from "react";
import BookCard from "../Bookdata/BookCard"; 
import { SlArrowRight, SlArrowLeft } from "react-icons/sl";

export default function BookSlider({ books = [], title, onBookClick }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5); 

  // --- RESPONSIVE SETTINGS ---
  // Adjusted to ensure arrows appear if you have > 6 books
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) setVisibleCount(2);       // Mobile: 2 books
      else if (width < 768) setVisibleCount(3);  // Tablet Portrait: 3 books
      else if (width < 1280) setVisibleCount(4); // Laptop: 4 books
      else if (width < 1536) setVisibleCount(5); // Desktop: 5 books
      else setVisibleCount(6);                   // Large Screens: 6 books
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  // Calculate pages
  const totalPages = visibleCount > 0 ? Math.ceil(books.length / visibleCount) : 0;
  
  // Show arrows only if we have more books than can fit on one screen
  const showArrows = books.length > visibleCount;

  // Reset to page 0 if books change (e.g., refresh)
  useEffect(() => {
    setCurrentPage(0);
  }, [books.length]);

  const startIndex = currentPage * visibleCount;
  const visibleBooks = books.slice(startIndex, startIndex + visibleCount);

  const handleNext = () => {
    if (showArrows) {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }
  };

  const handlePrev = () => {
    if (showArrows) {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    }
  };

  if (!books || books.length === 0) return null;

  return (
    <div className="relative w-full p-6 pt-0 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center px-2">
        {title && (
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide border-l-4 border-orange-500 pl-3">
            {title}
          </h2>
        )}

        {/* Navigation Arrows */}
        {showArrows && (
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              className="w-9 h-9 sm:w-10 sm:h-10 
                         bg-white/10 hover:bg-orange-500/80
                         border border-white/10 hover:border-orange-500
                         text-white rounded-full flex items-center justify-center 
                         transition-all duration-200 active:scale-95 shadow-md"
            >
              <SlArrowLeft size={16} />
            </button>

            <button
              onClick={handleNext}
              className="w-9 h-9 sm:w-10 sm:h-10 
                         bg-white/10 hover:bg-orange-500/80
                         border border-white/10 hover:border-orange-500
                         text-white rounded-full flex items-center justify-center 
                         transition-all duration-200 active:scale-95 shadow-md"
            >
              <SlArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 min-h-[300px]">
        {visibleBooks.map((book) => (
          <BookCard
            key={book.id}
            {...book}
            onClick={() => onBookClick && onBookClick(book)}
          />
        ))}
        
        {/* Fillers to keep height stable if last page has few books */}
        {Array.from({ length: visibleCount - visibleBooks.length }).map((_, i) => (
           <div key={`empty-${i}`} className="hidden md:block" />
        ))}
      </div>
    </div>
  );
}