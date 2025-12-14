import { useState, useEffect } from "react"; 
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

// --- Helper Components ---

function BookSynopsis({ synopsis }) {
  if (!synopsis) return null;
  return (
    <div className="mt-6 text-xs sm:text-sm md:text-base text-text-dim leading-relaxed max-h-40 md:max-h-52 overflow-y-auto pr-1 custom-scrollbar">
      <h2 className="text-sm sm:text-base font-semibold text-text mb-2">
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
    <div className="mt-6 text-xs sm:text-sm md:text-base text-text-dim">
      <h2 className="text-sm sm:text-base font-semibold text-text mb-3">
        About this book
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-glass rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-border">
        <div className="flex items-center gap-2">
          <FaFileAlt className="text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-text-dim opacity-70">
              Format
            </span>
            <span className="font-medium text-text">{format}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaFolderOpen className="text-secondary shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-text-dim opacity-70">
              File Size
            </span>
            <span className="font-medium text-text">{size}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaRulerVertical className="text-tertiary shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-text-dim opacity-70">
              Pages
            </span>
            <span className="font-medium text-text">{pages}</span>
          </div>
        </div>

        {/* Keeping specific colors for Globe/Published for visual variety, or map to theme if preferred */}
        <div className="flex items-center gap-2">
          <FaGlobe className="text-purple-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-text-dim opacity-70">
              Language
            </span>
            <span className="font-medium text-text">{language}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaFileAlt className="text-teal-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-text-dim opacity-70">
              Published
            </span>
            <span className="font-medium text-text">{year}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 sm:col-span-2 lg:col-span-3">
          <FaFolderOpen className="mt-[2px] text-yellow-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-text-dim opacity-70">
              File Path
            </span>
            <span className="font-mono text-[0.7rem] sm:text-xs break-all text-text-dim">
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
    <div className="mt-6 text-xs sm:text-sm md:text-base text-text-dim leading-relaxed">
      <h2 className="text-sm sm:text-base font-semibold text-text mb-2">
        About the author
      </h2>

      {author && (
        <p className="font-semibold text-text mb-1 text-sm sm:text-base">
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
      <h2 className="text-sm sm:text-base font-semibold text-text mb-3">
        Related books
      </h2>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 custom-scrollbar">
        {relatedBooks.map((book, index) => (
          <div key={book.id ?? index} className="shrink-0">
            <BookCard
              {...book} // Spread all props including id, title, coverImage
              onClick={onBookClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// === MAIN COMPONENT ===

export default function BookDetails({
  book,
  relatedBooks = [],
  onRelatedBookClick,
  coverSrc, 
  progress = 0, 
  onRefreshProgress, 
}) {
  const [openReader, setOpenReader] = useState(false);
  const [chapterAnchor, setChapterAnchor] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    setCurrentProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (book.id) {
      const savedRating = localStorage.getItem(`book_rating_${book.id}`);
      if (savedRating) {
        setUserRating(parseInt(savedRating));
      } else {
        setUserRating(book.rating || 0);
      }
    }
  }, [book.id, book.rating]);

  const hasImage = Boolean(coverSrc);
  const synopsis = book.synopsis || book.description;
  const effectiveRelatedBooks =
    relatedBooks.length > 0 ? relatedBooks : book.relatedBooks || [];

  const handleRate = (newRating) => {
    setUserRating(newRating);
    if (book.id) {
      localStorage.setItem(`book_rating_${book.id}`, newRating);
      const lastReadJson = localStorage.getItem("last_read_book");
      if (lastReadJson) {
        try {
          const lastReadData = JSON.parse(lastReadJson);
          if (lastReadData.id === book.id) {
            lastReadData.rating = newRating;
            localStorage.setItem("last_read_book", JSON.stringify(lastReadData));
          }
        } catch (e) {
          console.error("Failed to update last read rating", e);
        }
      }
    }
  };

  const handleStartReading = () => {
    const lastReadData = {
      id: book.id,
      title: book.title,
      author: book.author,
      coverImage: coverSrc, 
      filePath: book.filePath,
      progress: currentProgress,
      rating: userRating 
    };
    localStorage.setItem("last_read_book", JSON.stringify(lastReadData));

    setChapterAnchor(null);
    setOpenReader(true);
  };

  const handleChapterClick = (anchor) => {
    setChapterAnchor(anchor);
    setOpenReader(true);
  };

  const handleReaderClose = () => {
    setOpenReader(false);
    if (book.id) {
      const saved = localStorage.getItem(`book_progress_${book.id}`);
      if (saved) setCurrentProgress(parseFloat(saved));
    }
    if (onRefreshProgress) onRefreshProgress();
  };

  const handleAddToLibrary = () => console.log("Add to library clicked");
  const handleAddToFavorites = () => console.log("Add to favorites clicked");
  const handleRelatedBookClick = (relatedBook) =>
    onRelatedBookClick?.(relatedBook);

  return (
    <>
      {openReader && (
        <ReaderModal
          bookId={book.id}
          filePath={book.filePath}
          bookTitle={book.title}
          onClose={handleReaderClose} 
          chapterAnchor={chapterAnchor}
          initialProgress={currentProgress} 
        />
      )}

      {/* GlassCard now uses theme via CSS variables in its definition, or we can override here */}
      <GlassCard className="flex flex-col md:flex-row gap-4 lg:gap-8 p-4 md:p-6 mt-4 items-start bg-glass backdrop-blur-md border border-border">
        {/* Cover Section */}
        <div className="w-full md:w-1/4 flex flex-col items-center gap-4">
          <div className="flex justify-center items-center">
            {hasImage ? (
              <img
                src={coverSrc}
                alt={book.title}
                className="rounded-xl shadow-lg w-40 sm:w-44 md:w-52 lg:w-80 object-cover border border-border"
              />
            ) : (
              <div className="rounded-xl shadow-lg w-40 sm:w-44 md:w-52 lg:w-60 aspect-[3/4] bg-glass flex items-center justify-center text-center text-xs sm:text-sm md:text-base text-text font-semibold border border-border">
                {book.title}
              </div>
            )}
          </div>

          {currentProgress > 0 && (
            <div className="w-full px-2 max-w-[200px] lg:max-w-xs">
              <BookProgress progress={currentProgress} />
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="flex flex-col justify-start md:w-3/4 text-text">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            {book.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-text-dim mt-2">
            {book.author || "Unknown"}
          </p>

          {book.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 text-xs sm:text-sm text-text-dim">
              {book.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-glass rounded-full border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3">
            <StarRate 
              rating={userRating} 
              size={22} 
              onChange={handleRate} 
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6">
            <button
              className="px-5 sm:px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-sm sm:text-base font-semibold shadow-md transition-transform active:scale-95"
              onClick={handleStartReading}
            >
              {currentProgress > 0 && currentProgress < 99
                ? "CONTINUE READING"
                : "START READING"}
            </button>
            <button
              className="px-4 py-2 rounded-full bg-glass hover:bg-white/10 transition border border-border flex items-center gap-2 text-xs sm:text-sm text-text"
              onClick={handleAddToLibrary}
            >
              📚 Add to Library
            </button>
            <button
              className="px-4 py-2 rounded-full bg-glass hover:bg-white/10 transition border border-border flex items-center gap-2 text-xs sm:text-sm md:ml-auto text-text"
              onClick={handleAddToFavorites}
            >
              <FaHeart className="text-red-400" /> Add to Favorites
            </button>
          </div>

          {book.chapters?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm sm:text-base font-semibold text-text mb-3">
                Chapters
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                {book.chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <button
                      className="text-sm sm:text-base text-tertiary hover:underline"
                      onClick={() => handleChapterClick(chapter.id)}
                    >
                      {chapter.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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