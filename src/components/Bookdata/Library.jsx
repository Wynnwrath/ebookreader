import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import BookHistory from "./BookHistory";
import BookSlider from "./BookSlider";

export default function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. DATA FETCHING & MAPPING ---
  // Maps backend data and reads progress from LocalStorage
  const mapBooks = (raw) => {
    if (!Array.isArray(raw)) return [];
    
    return raw.map((b) => {
      // Get saved progress (0 to 100)
      const savedProgress = localStorage.getItem(`book_progress_${b.book_id}`);
      const progress = savedProgress ? parseFloat(savedProgress) : 0;

      return {
        id: b.book_id,
        title: b.title || "Untitled Book",
        coverImage: b.cover_image_path || "",
        type: b.file_type || "BOOK",
        filePath: b.file_path || "",
        author: b.author || "Unknown Author",
        progress: progress,
        currentPage: 0,
        pages: b.total_pages || 0
      };
    });
  };

  const fetchBooks = async () => {
    try {
      const raw = await invoke("list_books");
      
      // Cache raw data
      localStorage.setItem("library_raw_cache", JSON.stringify(raw));
      
      // Update state with mapped data (including latest progress)
      setBooks(mapBooks(raw));
      
    } catch (err) {
      console.error("list_books failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // CACHE FIRST: Load immediately for instant UI
    const cachedRaw = localStorage.getItem("library_raw_cache");
    if (cachedRaw) {
      try {
        const raw = JSON.parse(cachedRaw);
        setBooks(mapBooks(raw));
        setLoading(false);
      } catch (e) {
        console.error("Failed to parse library cache", e);
      }
    }

    // Then fetch fresh data
    fetchBooks();
  }, []);

  // --- 2. CATEGORIZATION LOGIC ---

  const continueReadingBooks = useMemo(() => {
    return books.filter(b => b.progress > 0 && b.progress < 100);
  }, [books]);

  // Completed Books Category
  const completedBooks = useMemo(() => {
    return books.filter(b => b.progress >= 100);
  }, [books]);

  const recentlyAddedBooks = useMemo(() => {
    return [...books].reverse(); 
  }, [books]);

  // --- 3. NAVIGATION ---

  const handleBookOpen = (book) => {
    const bookId = book.id ?? encodeURIComponent(book.title);
    navigate(`/book/${bookId}`, { state: { book } });
  };

  // --- 4. RENDER ---

  return (
    <div className="w-full min-h-screen p-6 flex flex-col gap-10">
      
      {/* STATS HISTORY */}
      <div className="flex justify-center w-full mt-4">
        <BookHistory />
      </div>

      {/* CONTENT SLIDERS */}
      <div className="w-full flex flex-col gap-10 pb-20">
        
        {loading ? (
           <div className="text-center text-gray-400 py-10 animate-pulse">Loading library...</div>
        ) : books.length === 0 ? (
           <div className="text-center text-gray-500 py-10">
             <p className="text-xl">Your library is empty.</p>
           </div>
        ) : (
          <>
            {/* 1. Continue Reading */}
            {continueReadingBooks.length > 0 && (
              <BookSlider
                books={continueReadingBooks}
                title="Continue Reading"
                onBookClick={handleBookOpen}
              />
            )}

            {/* 2. Completed Books (New Section) */}
            {completedBooks.length > 0 && (
              <BookSlider
                books={completedBooks}
                title="Completed"
                onBookClick={handleBookOpen}
              />
            )}

            {/* 3. Recently Added */}
            <BookSlider
              books={recentlyAddedBooks}
              title="Recently Added"
              onBookClick={handleBookOpen}
            />

            {/* 4. All Books */}
            <BookSlider
              books={books}
              title="All Books"
              onBookClick={handleBookOpen}
            />
          </>
        )}
      </div>
    </div>
  );
}