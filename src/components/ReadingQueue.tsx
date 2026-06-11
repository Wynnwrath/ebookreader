import React from "react";
import { FiBookOpen, FiPlay, FiBook, FiPlus, FiFolder } from "react-icons/fi";
import { Book } from "../types";

interface ReadingQueueProps {
  unopenedBooks: Book[];
  covers: Record<number, string>;
  onNavigateToBookDetails: (bookId: number) => void;
  onNavigateToBookReader: (bookId: number) => void;
  onImport: () => void;
  onImportFolder: () => void;
  hasAnyBooks: boolean;
}

const ReadingQueue: React.FC<ReadingQueueProps> = ({
  unopenedBooks,
  covers,
  onNavigateToBookDetails,
  onNavigateToBookReader,
  onImport,
  onImportFolder,
  hasAnyBooks,
}) => {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
        <h2 className="font-serif text-2xl font-bold text-on-surface">Reading Queue</h2>
        <span className="text-xs text-on-surface-variant/80 font-medium">Unopened volumes ready to explore</span>
      </div>

      {!hasAnyBooks ? (
        <div className="text-center py-16 border border-dashed border-outline-variant/30 rounded-xl bg-surface-container/20 flex flex-col items-center justify-center gap-4">
          <FiBookOpen className="w-12 h-12 text-on-surface-variant/40" />
          <h3 className="font-serif text-xl font-bold text-on-surface">No books in catalog yet</h3>
          <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
            Import ebooks from local path to populate your catalog and view recommendations.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button 
              onClick={onImport}
              className="bg-tertiary text-on-tertiary font-bold py-2.5 px-6 rounded-lg text-sm hover:bg-tertiary/90 transition shadow flex items-center gap-2 cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Import File</span>
            </button>
            <button 
              onClick={onImportFolder}
              className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/35 text-on-surface font-bold py-2.5 px-6 rounded-lg text-sm transition shadow flex items-center gap-2 cursor-pointer"
            >
              <FiFolder className="w-4 h-4" />
              <span>Import Folder</span>
            </button>
          </div>
        </div>
      ) : unopenedBooks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-outline-variant/20 rounded-2xl bg-surface-container/10 flex flex-col items-center justify-center gap-3">
          <FiBook className="w-10 h-10 text-on-surface-variant/30" />
          <h3 className="font-sans text-sm font-bold text-on-surface">Your queue is empty</h3>
          <p className="text-xs text-on-surface-variant/85 max-w-xs leading-relaxed">
            Every book in your library is currently in progress or completed. Time to import something new!
          </p>
          <button 
            onClick={onImport}
            className="mt-2 bg-tertiary/15 text-tertiary border border-tertiary/20 hover:bg-tertiary/25 hover:border-tertiary transition px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Import Ebook</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {unopenedBooks.slice(0, 10).map((book) => (
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

                {/* Visual indication tag of unopened book */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-tertiary uppercase tracking-wider">
                  New
                </div>

                {/* Resume hover Play Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToBookReader(book.id);
                    }}
                    className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary shadow-md hover:scale-105 transition ml-auto flex items-center justify-center"
                    title="Start Reading"
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
      )}
    </section>
  );
};

export default ReadingQueue;
