// src/components/BookComp/BookDetails.jsx
import { useState } from "react";
import {
  FaHeart,
  FaFileAlt,
  FaFolderOpen,
  FaRulerVertical,
  FaGlobe,
} from "react-icons/fa";
import GlassCard from "../../ui/GlassCard";
import StarRate from "../../assets/StarRate";
import BookCard from "../Bookdata/BookCard";

import ReaderModal from "./ReaderModal";
import BookProgress from "./BookProgress";

// NOTE: If you want to call Tauri commands directly from here later,
// you can uncomment this import and use `invoke` in the handlers below.
// import { invoke } from "@tauri-apps/api/tauri";

function BookSynopsis({ synopsis }) {
  if (!synopsis) return null;

  return (
    <div className="mt-6 text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed max-h-40 md:max-h-52 overflow-y-auto pr-1">
      <h2 className="text-sm sm:text-base font-semibold text-white mb-2">
        Synopsis
      </h2>
      <p className="opacity-90">{synopsis}</p>
    </div>
  );
}

function BookMeta({ book }) {
  const format = book.type || "Unknown";
  const size = book.size || "Unknown size";
  const pages = book.pages || "N/A";
  const language = book.language || "Unknown";
  const year = book.publishedYear || "Unknown";
  const path = book.filePath || "No file path available";

  return (
    <div className="mt-6 text-xs sm:text-sm md:text-base text-gray-200">
      <h2 className="text-sm sm:text-base font-semibold text-white mb-3">
        About this book
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-white/5 rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/10">
        <div className="flex items-center gap-2">
          <FaFileAlt className="text-orange-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              Format
            </span>
            <span className="font-medium text-white">{format}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaFolderOpen className="text-blue-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              File Size
            </span>
            <span className="font-medium text-white">{size}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaRulerVertical className="text-green-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              Pages
            </span>
            <span className="font-medium text-white">{pages}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaGlobe className="text-purple-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              Language
            </span>
            <span className="font-medium text-white">{language}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaFileAlt className="text-teal-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              Published
            </span>
            <span className="font-medium text-white">{year}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 sm:col-span-2 lg:col-span-3">
          <FaFolderOpen className="mt-[2px] text-yellow-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              File Path
            </span>
            <span className="font-mono text-[0.7rem] sm:text-xs break-all text-gray-200/90">
              {path}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookAuthor({ author, bio }) {
  if (!author && !bio) return null;

  return (
    <div className="mt-6 text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed">
      <h2 className="text-sm sm:text-base font-semibold text-white mb-2">
        About the author
      </h2>

      {author && (
        <p className="font-semibold text-white mb-1 text-sm sm:text-base">
          {author}
        </p>
      )}

      {bio && <p className="opacity-90">{bio}</p>}
    </div>
  );
}

function BookRelated({ relatedBooks = [], onBookClick }) {
  if (!relatedBooks.length) return null;

  return (
    <div className="mt-6">
      <h2 className="text-sm sm:text-base font-semibold text-white mb-3">
        Related books
      </h2>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
        {relatedBooks.map((book, index) => (
          <div key={book.id ?? index} className="shrink-0">
            <BookCard
              id={book.id}
              title={book.title}
              author={book.author}
              coverImage={book.coverImage}
              type={book.type}
              filePath={book.filePath}
              // rating, tags, pages, currentPage can be passed too;
              // BookCard will just ignore what it doesn't use.
              rating={book.rating}
              tags={book.tags}
              pages={book.pages}
              currentPage={book.currentPage}
              onClick={onBookClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BookDetails({
  book,
  relatedBooks = [],
  onRelatedBookClick,
}) {
  const [imageError, setImageError] = useState(false);
  const [openReader, setOpenReader] = useState(false);

  // reading progress is owned here so backend can track it
  const [currentPage, setCurrentPage] = useState(book.currentPage ?? 1);

  // Make sure we never pass 0 into the reader
  const totalPages =
    book.pages && book.pages > 0 ? book.pages : 1;

  const hasImage = book.coverImage && !imageError;
  const synopsis = book.synopsis || book.description;
  const effectiveRelatedBooks =
    relatedBooks && relatedBooks.length > 0
      ? relatedBooks
      : book.relatedBooks || [];

  // ---------------------------------------------------------------------------
  // ACTION HANDLERS (TEMP – backend can hook into these)
  // ---------------------------------------------------------------------------

  const handleStartReading = () => {
    console.log("[BookDetails] START_READING clicked", { book });
    setOpenReader(true);

    // Example Tauri hook:
    // invoke("start_reading", { bookId: book.id });
  };

  const handleAddToLibrary = () => {
    console.log("[BookDetails] ADD_TO_LIBRARY clicked", { book });
    // invoke("add_to_library", { bookId: book.id });
  };

  const handleAddToFavorites = () => {
    console.log("[BookDetails] ADD_TO_FAVORITES clicked", { book });
    // invoke("add_to_favorites", { bookId: book.id });
  };

  const handleRelatedBookClick = (relatedBook) => {
    console.log("[BookDetails] RELATED_BOOK clicked", { relatedBook });
    if (onRelatedBookClick) onRelatedBookClick(relatedBook);
  };

  // Called whenever user presses next/prev in the reader
  const handlePageChange = (page) => {
    // clamp just in case
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);

    console.log("[BookDetails] Reader page changed", {
      bookId: book.id,
      page: clamped,
    });

    // Backend can persist reading progress here
    // invoke("update_read_progress", { bookId: book.id, page: clamped });
  };

  return (
    <>
      {/* READER POPUP (blurred overlay) */}
      {openReader && (
        <ReaderModal
          bookId={book.id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onClose={() => setOpenReader(false)}
        />
      )}

      <GlassCard className="flex flex-col md:flex-row gap-4 lg:gap-8 p-4 md:p-6 mt-4 items-start">
        {/* COVER AREA */}
        <div className="w-full md:w-1/4 flex justify-center items-center">
          {hasImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="rounded-xl shadow-lg w-40 sm:w-44 md:w-52 lg:w-56 aspect-[3/4] object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="
                rounded-xl shadow-lg 
                w-40 sm:w-44 md:w-52 lg:w-60
                aspect-[3/4]
                bg-white/10 border border-white/20 
                flex items-center justify-center
                text-center px-4 
                text-xs sm:text-sm md:text-base text-white font-semibold
              "
            >
              {book.title}
            </div>
          )}
        </div>

        {/* DETAILS AREA */}
        <div className="flex flex-col justify-start md:w-3/4 text-white">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            {book.title}
          </h1>

          {/* Author */}
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mt-2">
            {book.author || "Unknown"}
          </p>

          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 text-xs sm:text-sm text-gray-300">
              {book.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/10 rounded-full border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Star rating */}
          <div className="mt-3">
            <StarRate rating={book.rating ?? 0} size={22} />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                className="
                  handle-start-reading
                  px-5 sm:px-6 py-2 rounded-full bg-orange-500 hover:bg-orange-600 
                  transition text-white text-sm sm:text-base font-semibold shadow-md
                "
                onClick={handleStartReading}
              >
                START READING
              </button>

              <button
                className="
                  handle-add-library
                  px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition 
                  border border-white/20 flex items-center gap-2 text-xs sm:text-sm
                "
                onClick={handleAddToLibrary}
              >
                <span>📚</span>
                <span>Add to Library</span>
              </button>
            </div>

            <button
              className="
                handle-add-favorite
                px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition 
                border border-white/20 flex items-center gap-2 text-xs sm:text-sm md:ml-auto
              "
              onClick={handleAddToFavorites}
            >
              <FaHeart className="text-red-400" />
              <span>Add to Favorites</span>
            </button>
          </div>

          {/* REUSABLE BOOK PROGRESS (same data used by reader modal) */}
          <BookProgress
            currentPage={currentPage}
            totalPages={totalPages}
            className="mt-4"
          />

          <BookSynopsis synopsis={synopsis} />
          <BookMeta book={book} />
          <BookAuthor author={book.author} bio={book.authorBio} />
          <BookRelated
            relatedBooks={effectiveRelatedBooks}
            onBookClick={handleRelatedBookClick}
          />
        </div>
      </GlassCard>
    </>
  );
}
