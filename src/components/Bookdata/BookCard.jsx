import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BookProgress from "../BookComp/BookProgress";
import BookTooltip from "../BookComp/BookToolTip"; 
import { fetchCoverPage } from "./fetchCoverPage"; 

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
  rating = 0,
}) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coverSrc, setCoverSrc] = useState(coverImage || "");

  // 1. Initialize progress directly from LocalStorage (Instant load)
  const [readingProgress, setReadingProgress] = useState(() => {
    if (!id) return 0;
    const saved = localStorage.getItem(`book_progress_${id}`);
    return saved ? parseFloat(saved) : 0;
  });

  const effectiveTotalPages = totalPages || pages || 0;
  
  // 2. Show progress if we have LocalStorage data OR backend data
  const hasProgress = readingProgress > 0 || (currentPage > 0 && effectiveTotalPages > 0);
  const hasImage = Boolean(coverSrc) && !imageError;

  useEffect(() => {
    let mounted = true;
    
    // Refresh progress if ID changes
    if (id) {
         const saved = localStorage.getItem(`book_progress_${id}`);
         if (mounted) setReadingProgress(saved ? parseFloat(saved) : 0);
    }

    const loadCover = async () => {
      if (!id) return;
      const url = await fetchCoverPage(id);
      if (mounted && url) {
        setCoverSrc(url);
      } else if (mounted) {
        setImageError(true);
      }
    };

    loadCover();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleClick = () => {
    setLoading(true);
    try {
      const bookId = id ?? encodeURIComponent(title);
      navigate(`/book/${bookId}`, {
        state: { 
          book: { 
            id, title, author, coverImage, type, filePath, currentPage, pages: effectiveTotalPages,
            progress: readingProgress, rating 
          },
          preloadedCover: coverSrc 
        },
      });
    } catch (err) {
      console.error("Failed to navigate to book:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 'group' enables the hover state for children (the tooltip)
    // 'relative' ensures the tooltip positions itself relative to this specific card
    <div className="group relative flex flex-col items-center gap-2">
      
      {/* --- SEPARATE TOOLTIP COMPONENT --- */}
      <BookTooltip 
        title={title} 
        author={author} 
        pages={effectiveTotalPages} 
        rating={rating}
      />

      {/* --- CARD VISUALS --- */}
      <div
        className={`
          handle-bookcard-click 
          w-24 sm:w-28 md:w-32 lg:w-34 xl:w-60 
          flex flex-col rounded-lg overflow-hidden cursor-pointer 
          transition-transform duration-200 hover:scale-[1.04] 
          bg-white/10 backdrop-blur-md border border-white/20 
          shadow-lg shadow-orange-500/10 
          bg-gradient-to-br from-orange-300/10 via-purple-500/10 to-pink-500/10 
          ${loading ? "opacity-50 cursor-wait" : ""}
        `}
        onClick={handleClick}
      >
        {hasImage ? (
          <div className="aspect-[3/4] relative overflow-hidden">
            {/* Background Blur Layer */}
            <img
              src={coverSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-50 scale-110" 
              aria-hidden="true"
            />
            
            {/* Main Image */}
            <img
              src={coverSrc}
              alt={title}
              className="relative w-full h-full object-contain z-10" 
              onError={() => setImageError(true)}
            />

            {/* Gradient Overlay */}
            <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-20" />
          </div>
        ) : (
          <div className="aspect-[3/4] bg-white/10 flex items-center justify-center text-white/80 px-2 text-center">
            <span className="text-sm">{title}</span>
          </div>
        )}

        {/* Text Details */}
        <div className="p-2 text-center bg-black/30 border-t border-white/10 relative z-20">
          <h3 className="text-sm font-semibold truncate text-white">{title}</h3>
          <p className="text-xs text-gray-300 truncate">{author}</p>
          <p className="text-[10px] text-orange-300 mt-1 uppercase tracking-wide">
            {type || "BOOK"}
          </p>
        </div>
      </div>

      {/* --- PROGRESS BAR --- */}
      {hasProgress && (
        <BookProgress
          progress={readingProgress > 0 ? readingProgress : undefined}
          currentPage={currentPage}
          totalPages={effectiveTotalPages}
          className="w-full px-2" 
        />
      )}
    </div>
  );
}