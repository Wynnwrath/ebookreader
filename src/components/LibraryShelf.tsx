import React from "react";
import { FiBookOpen, FiPlay } from "react-icons/fi";
import { Book } from "../types";

interface LibraryShelfProps {
  books: Book[];
  covers: Record<number, string>;
  onNavigateToBookDetails: (bookId: number) => void;
  onNavigateToBookReader: (bookId: number) => void;
}

const LibraryShelf: React.FC<LibraryShelfProps> = ({
  books,
  covers,
  onNavigateToBookDetails,
  onNavigateToBookReader,
}) => {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
        <h2 className="font-serif text-2xl font-bold text-on-surface">Library Shelf</h2>
        <span className="text-xs text-on-surface-variant/80 font-medium">All books in your archive</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {books.slice(0, 10).map((book) => (
          <div 
            key={book.id}
            onClick={() => onNavigateToBookDetails(book.id)}
            className="group cursor-pointer space-y-3 relative"
          >
            {/* Visual Cover Art Wrapper */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-300">
              {covers[book.id] ? (
                <img 
                  alt={book.title} 
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-300 animate-fade-in cover-image" 
                  src={covers[book.id]} 
                />
              ) : (
                <div className="w-full h-full bg-surface-container flex items-center justify-center">
                  <FiBookOpen className="text-on-surface-variant/30 w-8 h-8" />
                </div>
              )}

              {/* Progress tag overlay if in progress */}
              {book.progress > 0 && book.progress < 100 && (
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-primary uppercase tracking-wider">
                  {book.progress}%
                </div>
              )}

              {/* Completed tag overlay if completed */}
              {book.progress === 100 && (
                <div className="absolute top-2 left-2 bg-black/65 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-tertiary uppercase tracking-wider">
                  Completed
                </div>
              )}

              {/* Resume hover Play Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToBookReader(book.id);
                  }}
                  className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary shadow-md hover:scale-105 transition ml-auto flex items-center justify-center"
                  title="Read Book"
                >
                  <FiPlay className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-1">
              <h3 className="font-serif text-sm font-bold text-on-surface truncate group-hover:text-tertiary transition-colors leading-tight">
                {book.title}
              </h3>
              <p className="font-sans text-[11px] text-on-surface-variant/80 truncate">
                {book.author}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LibraryShelf;
