import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { convertFileSrc } from "@tauri-apps/api/core"; // ✅ Import this
import StarRate from '../assets/StarRate';
import defaultCover from '../images/bookCover.png'; 

export default function LastRead() {
  const navigate = useNavigate();
  const [lastBook, setLastBook] = useState(null);
  const [coverSrc, setCoverSrc] = useState(""); // ✅ New state for the safe image URL

  useEffect(() => {
    const saved = localStorage.getItem("last_read_book");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Update progress from specific book storage if available
        const specificProgress = localStorage.getItem(`book_progress_${parsed.id}`);
        if (specificProgress) {
            parsed.progress = parseFloat(specificProgress);
        }
        
        setLastBook(parsed);

        // ✅ FIX: Convert the raw file path to a displayable URL immediately
        if (parsed.coverImage) {
          // Check if it's already a valid web URL or data string
          const isWebUrl = /^(http|https|asset|tauri|blob|data):/.test(parsed.coverImage);
          
          if (isWebUrl) {
            setCoverSrc(parsed.coverImage);
          } else {
            // It's a local file path, convert it!
            setCoverSrc(convertFileSrc(parsed.coverImage));
          }
        } else {
          setCoverSrc(defaultCover);
        }

      } catch (e) {
        console.error("Failed to parse last read book", e);
      }
    }
  }, []);

  const handleContinueReading = () => {
    if (!lastBook) return;
    navigate(`/book/${lastBook.id}`, {
      state: { 
        book: {
          id: lastBook.id,
          title: lastBook.title,
          author: lastBook.author,
          filePath: lastBook.filePath,
          progress: lastBook.progress 
        },
        // Pass the pre-converted cover so the next page doesn't flicker
        preloadedCover: coverSrc 
      }
    });
  };

  const handleImageError = () => {
    setCoverSrc(defaultCover);
  };

  if (!lastBook) {
    return (
      <div className="[grid-area:last] w-full h-full p-2">
        <div className="
          w-full h-full flex flex-col items-center justify-center 
          bg-surface border border-border 
          rounded-2xl p-6 shadow-lg backdrop-blur-md
        ">
           <span className="text-4xl mb-2 opacity-50">📚</span>
           <p className="text-text-dim text-sm font-medium">No recent reads yet.</p>
           <p className="text-text-dim text-xs mt-1 opacity-70">Start a book to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="[grid-area:last] w-full h-full">
      <div className="
        w-full h-full
        flex flex-row items-center gap-6
        bg-surface
        border border-border 
        rounded-2xl
        p-6 sm:p-8
        shadow-lg
        relative overflow-hidden
        group
      ">
        
        {/* Book Cover */}
        <div className="relative shrink-0 w-32 h-48 sm:w-40 sm:h-56 shadow-2xl rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-500">
          <img
            src={coverSrc || defaultCover} // ✅ Use the safe 'coverSrc'
            alt={lastBook.title}
            className="w-full h-full object-cover"
            onError={handleImageError} 
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col justify-center min-w-0 z-10 h-full">
          
          <div className="flex flex-col gap-1 mb-3">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Continue Reading
            </span>
            
            <h2 className="text-text text-lg font-normal leading-snug">
              Did you read <br />
              <span className="text-text font-bold text-xl sm:text-2xl truncate block" title={lastBook.title}>
                {lastBook.title}
              </span>
            </h2>
            
            <p className="text-xs text-text-dim font-light mt-0.5 truncate">
              by {lastBook.author || "Unknown"}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <StarRate rating={lastBook.rating || 0} />
            <span className="text-xs text-text-dim font-medium pt-0.5">
              {lastBook.rating ? Number(lastBook.rating).toFixed(1) : "N/A"}
            </span>
          </div>

          <button
            onClick={handleContinueReading}
            className="
              w-fit px-6 py-2
              bg-glass hover:bg-white/10
              text-xs sm:text-sm text-text font-medium tracking-wide
              rounded-full transition-colors shadow-md border border-border
            "
          >
            Read Today
          </button>

        </div>
      </div>
    </div>
  );
}