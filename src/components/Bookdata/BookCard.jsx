import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BookProgress from "../BookComp/BookProgress";
import { fetchCoverPage } from "./fetchCoverPage"; // Ensure path is correct

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
  const [coverSrc, setCoverSrc] = useState(coverImage || "");

  const effectiveTotalPages = totalPages || pages || 0;
  const hasProgress = currentPage > 0 && effectiveTotalPages > 0;
  const hasImage = Boolean(coverSrc) && !imageError;

  useEffect(() => {
    let mounted = true;
    let objectUrl = null;

    const loadCover = async () => {
      if (!id) return;
      const url = await fetchCoverPage(id);
      if (mounted && url) {
        objectUrl = url;
        setCoverSrc(url);
      } else if (mounted) {
        setImageError(true);
      }
    };

    loadCover();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  const handleClick = () => {
    setLoading(true);
    try {
      const bookId = id ?? encodeURIComponent(title);
      navigate(`/book/${bookId}`, {
        state: { book: { id, title, author, coverImage, type, filePath, currentPage, pages: effectiveTotalPages } },
      });
    } catch (err) {
      console.error("Failed to navigate to book:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`handle-bookcard-click w-24 sm:w-28 md:w-32 lg:w-34 xl:w-60 flex flex-col rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.04] bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-orange-500/10 bg-gradient-to-br from-orange-300/10 via-purple-500/10 to-pink-500/10 ${loading ? "opacity-50 cursor-wait" : ""}`}
        onClick={handleClick}
      >
        {hasImage ? (
          // Added 'bg-black/20' so the empty space around the book looks darker/nicer
          <div className="aspect-[3/4] relative overflow-hidden bg-black/20 flex items-center justify-center">
            <img
              src={coverSrc}
              alt={title}
              // CHANGE HERE: 'object-contain' fits the whole image without cropping
              className="w-full h-full object-contain" 
              onError={() => setImageError(true)}
            />
            {/* Optional: Remove the gradient overlay if it obscures the book too much, or keep it for style */}
            <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
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