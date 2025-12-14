import { useState, useEffect } from "react";
import BookCard from "../Bookdata/BookCard"; 
import { SlArrowRight, SlArrowLeft } from "react-icons/sl";

export default function BookSlider({ books = [], title, onBookClick }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5); 

  // --- RESPONSIVE SETTINGS ---
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) setVisibleCount(2);       
      else if (width < 768) setVisibleCount(3);  
      else if (width < 1280) setVisibleCount(4); 
      else if (width < 1536) setVisibleCount(5); 
      else setVisibleCount(6);                   
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const totalPages = visibleCount > 0 ? Math.ceil(books.length / visibleCount) : 0;
  const showArrows = books.length > visibleCount;

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
      {/* key={currentPage} forces the grid to re-render (and re-animate) when page changes */}
      <div 
        key={currentPage}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 min-h-[300px]"
      >
        {visibleBooks.map((book, index) => (
          <div
            key={book.id}
            className="animate-pop-in flex justify-center" // Center helps align cards in grid cells
            style={{ 
              opacity: 0, // Start invisible so animation can fade it in
              animationFillMode: 'forwards', 
              animationDuration: '0.4s', // Faster than the default 1.3s
              animationDelay: `${index * 75}ms` // Stagger effect
            }}
          >
            <BookCard
              {...book}
              onClick={() => onBookClick && onBookClick(book)}
            />
          </div>
        ))}
        
        {/* Fillers to keep height stable */}
        {Array.from({ length: visibleCount - visibleBooks.length }).map((_, i) => (
           <div key={`empty-${i}`} className="hidden md:block" />
        ))}
      </div>
    </div>
  );
}