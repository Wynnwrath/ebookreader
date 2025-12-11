// src/components/Bookdata/BookCard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
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
  pages,
}) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasImage = Boolean(coverImage) && !imageError;

  const effectiveTotalPages = totalPages || pages || 0;
  const hasProgress = currentPage > 0 && effectiveTotalPages > 0;

  const handleClick = async () => {
    setLoading(true);

    try {
      // -------------------------------
      // TEMP MOCK for testing
      // -------------------------------
      const MOCK = true; // <-- set false when ready for real backend
      let book;
      if (MOCK) {
        console.log("[BookCard] Using mock book data");
        book = {
          id: id || "temp123",
          title,
          author: author || "Unknown Author",
          coverImage,
          type: type || "BOOK",
          filePath: filePath || "",
          currentPage,
          pages: effectiveTotalPages,
        };
      } else {
        // Real backend call
        const metadata = await invoke("fetch_metadata", { book_name: title });
        book = {
          id: metadata?.book_id || id,
          title: metadata?.title || title,
          author: metadata?.author || author || "",
          coverImage: metadata?.cover_image_path || coverImage || "",
          type: metadata?.file_type || type || "BOOK",
          filePath: metadata?.file_path || filePath || "",
          currentPage: metadata?.current_page || currentPage,
          pages: metadata?.total_pages || effectiveTotalPages,
        };
      }

      const bookId = book.id ?? encodeURIComponent(book.title);
      navigate(`/book/${bookId}`, { state: { book } });
    } catch (err) {
      console.error("Failed to fetch book metadata:", err);
      alert("Unable to load book details. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
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
          ${loading ? "opacity-50 cursor-wait" : ""}
        `}
        onClick={handleClick}
      >
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

        <div className="p-2 text-center bg-black/30 border-t border-white/10">
          <h3 className="text-sm font-semibold truncate text-white">{title}</h3>
          <p className="text-xs text-gray-300 truncate">{author}</p>
          <p className="text-[10px] text-orange-300 mt-1 uppercase tracking-wide">
            {type || "BOOK"}
          </p>
        </div>
      </div>

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
