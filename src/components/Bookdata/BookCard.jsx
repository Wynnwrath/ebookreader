// src/components/Bookdata/BookCard.jsx
import { useState } from "react";
import BookProgress from "../BookComp/BookProgress";

export default function BookCard({
  id,
  title,
  author,
  coverImage,
  type,
  filePath,
  currentPage = 0,
  totalPages = 0,
  pages,              // NEW: alias from backend
  onClick,
}) {
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(coverImage) && !imageError;

  // Prefer explicit totalPages, otherwise fallback to pages
  const effectiveTotalPages = totalPages || pages || 0;
  const hasProgress = currentPage > 0 && effectiveTotalPages > 0;

  const handleClick = () => {
    const book = {
      id,
      title,
      author,
      coverImage,
      type,
      filePath,
      currentPage,
      pages: effectiveTotalPages,
    };

    if (onClick) onClick(book);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* MAIN CARD */}
      <div
        className={`
          handle-bookcard-click
          w-24 sm:w-28 md:w-32 lg:w-34 xl:w-38
          flex flex-col
          rounded-lg overflow-hidden
          cursor-pointer
          transition-transform duration-200 hover:scale-[1.04]

          bg-white/10 backdrop-blur-md
          border border-white/20
          shadow-lg shadow-orange-500/10
          bg-gradient-to-br from-orange-300/10 via-purple-500/10 to-pink-500/10
        `}
        onClick={handleClick}
      >
        {/* COVER */}
        {hasImage ? (
          <div className="aspect-[3/4] relative overflow-hidden bg-black/10">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[3/4] bg-white/10 flex items-center justify-center text-white/80 px-2 text-center">
            <span className="text-sm">{title}</span>
          </div>
        )}

        {/* BOOK INFO */}
        <div className="p-2 text-center bg-black/30 border-t border-white/10">
          <h3 className="text-sm font-semibold truncate text-white">
            {title}
          </h3>

          <p className="text-xs text-gray-300 truncate">{author}</p>

          <p className="text-[10px] text-orange-300 mt-1 uppercase tracking-wide">
            {type || "BOOK"}
          </p>
        </div>
      </div>

      {/* BOOK PROGRESS (if any) */}
      {hasProgress && (
        <BookProgress
          currentPage={currentPage}
          totalPages={effectiveTotalPages}
          className="w-full"
        />
      )}
    </div>
  );
}
