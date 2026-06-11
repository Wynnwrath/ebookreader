import React from "react";
import { FiBookOpen, FiPlay } from "react-icons/fi";
import { Book } from "../types";

interface UnsortedBooksProps {
  unsortedBooks: Book[];
  covers: Record<number, string>;
  onNavigateToBookDetails: (bookId: number) => void;
  onNavigateToBookReader: (bookId: number) => void;
}

const UnsortedBooks: React.FC<UnsortedBooksProps> = ({
  unsortedBooks,
  covers,
  onNavigateToBookDetails,
  onNavigateToBookReader,
}) => {
  return (
    <section className="space-y-4 pt-6">
      <div className="flex justify-between items-end border-b border-outline-variant/10 pb-4">
        <h3 className="font-headline-md text-xl font-bold text-on-surface">Unsorted Volumes</h3>
        <span className="text-xs font-semibold text-on-surface-variant">{unsortedBooks.length} Books</span>
      </div>

      {unsortedBooks.length === 0 ? (
        <p className="text-sm text-on-surface-variant italic py-4">All books have been catalogued into collections.</p>
      ) : (
        <div className="space-y-2.5">
          {unsortedBooks.map((book) => (
            <div 
              key={book.id}
              onClick={() => onNavigateToBookDetails(book.id)}
              className="flex items-center justify-between p-4 bg-surface-container/30 border border-outline-variant/10 rounded-xl hover:bg-surface-container-high/40 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-14 bg-surface-container-highest border border-outline-variant/20 rounded shadow-sm flex items-center justify-center shrink-0">
                  {covers[book.id] ? (
                    <img src={covers[book.id]} alt={book.title} className="w-full h-full object-cover rounded cover-image" />
                  ) : (
                    <FiBookOpen className="text-on-surface-variant/40 w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-headline-md text-base font-bold text-on-surface group-hover:text-tertiary transition-colors">{book.title}</h4>
                  <p className="font-label-sm text-xs text-on-surface-variant">{book.author}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-label-sm text-xs text-on-surface-variant/50">Unsorted</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToBookReader(book.id);
                  }}
                  className="p-2 rounded-full hover:bg-tertiary/10 text-on-surface-variant group-hover:text-tertiary transition-all"
                >
                  <FiPlay className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default UnsortedBooks;
