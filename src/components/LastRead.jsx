import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StarRate from '../assets/StarRate';
import defaultCover from '../images/bookCover.png'; // Used as fallback

export default function LastRead() {
  const navigate = useNavigate();
  const [lastBook, setLastBook] = useState(null);

  // 1. Load data from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("last_read_book");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // 2. Attempt to get the latest progress percentage (if it exists separately)
        const specificProgress = localStorage.getItem(`book_progress_${parsed.id}`);
        if (specificProgress) {
            parsed.progress = parseFloat(specificProgress);
        }

        setLastBook(parsed);
      } catch (e) {
        console.error("Failed to parse last read book", e);
      }
    }
  }, []);

  const handleContinueReading = () => {
    if (!lastBook) return;

    // Navigate to the book details page to open the reader
    navigate(`/book/${lastBook.id}`, {
      state: { 
        book: {
          id: lastBook.id,
          title: lastBook.title,
          author: lastBook.author,
          filePath: lastBook.filePath,
          progress: lastBook.progress 
        },
        preloadedCover: lastBook.coverImage
      }
    });
  };

  // 3. Render Placeholder if no book found
  if (!lastBook) {
    return (
      <div className="[grid-area:last] w-full h-full p-2">
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#2A2432]/90 border border-white/10 rounded-2xl p-6 shadow-lg backdrop-blur-md">
           <span className="text-4xl mb-2">📚</span>
           <p className="text-gray-400 text-sm font-medium">No recent reads yet.</p>
           <p className="text-gray-500 text-xs mt-1">Start a book to see it here.</p>
        </div>
      </div>
    );
  }

  // 4. Render the Card with Data
  return (
    <div className="[grid-area:last] w-full h-full">
      {/* Card Container */}
      <div className="
        w-full h-full
        flex flex-row items-center gap-6
        bg-[#2A2432]
        border border-white/10 rounded-2xl
        p-6 sm:p-8
        shadow-lg shadow-black/30
        relative overflow-hidden
        group
      ">
        
        {/* Book Cover */}
        <div className="relative shrink-0 w-32 h-48 sm:w-50 sm:h-75 shadow-2xl rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-500">
          <img
            src={lastBook.coverImage || defaultCover}
            alt={lastBook.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = defaultCover; }} // Handle broken links
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col justify-center min-w-0 z-10 h-full">
          
          <div className="flex flex-col gap-1 mb-3">
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
              Continue Reading
            </span>
            
            <h2 className="text-white text-lg font-normal leading-snug">
              Did you read <br />
              <span className="text-white font-bold text-xl sm:text-2xl truncate block" title={lastBook.title}>
                {lastBook.title}
              </span>
            </h2>
            
            <p className="text-xs text-gray-400 font-light mt-0.5 truncate">
              by {lastBook.author || "Unknown"}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <StarRate rating={lastBook.rating || 0} />
            <span className="text-xs text-gray-500 font-medium pt-0.5">
              {lastBook.rating ? Number(lastBook.rating).toFixed(1) : "N/A"}
            </span>
          </div>

          <button
            onClick={handleContinueReading}
            className="
              w-fit px-6 py-2
              bg-[#383240] hover:bg-[#453d4f]
              text-xs sm:text-sm text-gray-200 font-medium tracking-wide
              rounded-full transition-colors shadow-md
            "
          >
            Read Today
          </button>

        </div>
      </div>
    </div>
  );
}