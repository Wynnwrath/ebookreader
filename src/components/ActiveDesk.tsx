import React from "react";
import { FiBookOpen, FiPlay, FiChevronRight, FiPlus, FiFolder } from "react-icons/fi";
import { Book } from "../types";

interface ActiveDeskProps {
  displayReadingBooks: Book[];
  covers: Record<number, string>;
  onNavigateToBook: (bookId: number) => void;
  onNavigateToLibrary: () => void;
  onImport: () => void;
  onImportFolder: () => void;
  hasAnyBooks: boolean;
}

const ActiveDesk: React.FC<ActiveDeskProps> = ({
  displayReadingBooks,
  covers,
  onNavigateToBook,
  onNavigateToLibrary,
  onImport,
  onImportFolder,
  hasAnyBooks,
}) => {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
        <h2 className="font-serif text-2xl font-bold text-on-surface">Active Desk</h2>
        {hasAnyBooks && (
          <button 
            onClick={onNavigateToLibrary}
            className="font-sans text-xs text-on-surface-variant/85 hover:text-tertiary transition-colors flex items-center gap-1 font-bold cursor-pointer"
          >
            View Full Catalog <FiChevronRight className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {displayReadingBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayReadingBooks.map((book) => (
            <div 
              key={book.id}
              onClick={() => onNavigateToBook(book.id)}
              className="group flex gap-5 bg-surface-container-low/30 border border-outline-variant/10 rounded-2xl p-4 hover:bg-surface-container-low/80 hover:border-outline-variant/20 transition-all duration-300 shadow-sm cursor-pointer relative overflow-hidden"
            >
              {/* Cover art on the left with hover overlay */}
              <div className="w-[100px] sm:w-[110px] aspect-[2/3] rounded-xl overflow-hidden border border-outline-variant/20 shadow-md shrink-0 bg-surface-container relative">
                {covers[book.id] ? (
                  <img 
                    alt={book.title} 
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300 cover-image" 
                    src={covers[book.id]} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiBookOpen className="text-on-surface-variant/30 w-8 h-8" />
                  </div>
                )}
                {/* Subtle Play Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition duration-300">
                    <FiPlay className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Details on the right */}
              <div className="flex-1 flex flex-col justify-between self-stretch py-1 min-w-0">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-on-surface leading-tight group-hover:text-tertiary transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant/75 truncate mt-0.5">
                    {book.author}
                  </p>
                </div>

                <div className="space-y-3 mt-auto">
                  {/* Progress details & solid indicator line */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800/80 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-tertiary rounded-full transition-all duration-300" 
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-on-surface-variant/70 font-bold tracking-wide">
                      <span>{book.progress}% COMPLETED</span>
                      {book.lastRead && <span>{book.lastRead.toUpperCase()}</span>}
                    </div>
                  </div>

                  {/* Resume Text Link */}
                  <span className="text-[11px] font-bold text-tertiary flex items-center gap-1.5 group-hover:text-tertiary/90 transition-colors">
                    <span>Resume Reading</span>
                    <FiChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-outline-variant/20 rounded-2xl bg-surface-container-low/20 text-center space-y-4">
          <div className="p-4 rounded-full bg-surface-container-high border border-outline-variant/10 text-on-surface-variant">
            <FiBookOpen className="w-8 h-8 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-on-surface">Your reading desk is empty</h3>
            <p className="text-xs text-on-surface-variant/80 max-w-sm">
              {hasAnyBooks 
                ? "Go to your library and open a book to start tracking your progress here."
                : "Import your first EPUB or PDF book to start reading and tracking progress."
              }
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {hasAnyBooks ? (
              <button
                onClick={onNavigateToLibrary}
                className="font-semibold text-xs py-2 px-4 bg-tertiary text-surface-container-lowest hover:bg-tertiary/90 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm animate-pop-in"
              >
                <span>Go to Library</span>
                <FiChevronRight className="w-4.5 h-4.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={onImport}
                  className="font-semibold text-xs py-2 px-4 bg-tertiary text-surface-container-lowest hover:bg-tertiary/90 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Import File</span>
                </button>
                <button
                  onClick={onImportFolder}
                  className="font-semibold text-xs py-2 px-4 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/35 text-on-surface rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <FiFolder className="w-4 h-4" />
                  <span>Import Folder</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ActiveDesk;
