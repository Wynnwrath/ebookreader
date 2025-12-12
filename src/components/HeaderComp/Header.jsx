import { useState, useEffect, useRef } from "react";
import { IoIosSearch } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core"; 
import HeaderRight from "./HeaderRight";

export default function Header() {
  const navigate = useNavigate();
  
  const [query, setQuery] = useState("");
  const [allBooks, setAllBooks] = useState([]); // Stores raw metadata
  const [results, setResults] = useState([]);   // Stores filtered & processed books
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // 1. Fetch metadata for all books
  useEffect(() => {
    async function loadBooks() {
      try {
        const raw = await invoke("list_books");
        // Keep the data lightweight. We resolve images only when searching.
        const mapped = raw.map((b) => ({
          id: b.book_id,
          title: b.title || "Untitled",
          author: b.author || "Unknown",
          path: b.cover_image_path // Keep the raw path for fallback
        }));
        setAllBooks(mapped);
      } catch (err) {
        console.error("Header search failed to load books:", err);
      }
    }
    loadBooks();

    // Outside click handler
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. Helper: Smart Cover Resolver
  const resolveCover = (book) => {
    // A. Check LocalStorage (Fastest & cached)
    const cached = localStorage.getItem(`book_cover_${book.id}`);
    if (cached) return cached; // Returns the Data URI string

    // B. Fallback to File Path (using Tauri's secure asset protocol)
    if (book.path) {
      return convertFileSrc(book.path);
    }

    return null;
  };

  // 3. Search Handler
  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim() === "") {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const lowerVal = val.toLowerCase();
    
    // Filter books
    const filtered = allBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(lowerVal) ||
        book.author.toLowerCase().includes(lowerVal)
    );

    // Process top 5 results (Resolve covers NOW)
    const topResults = filtered.slice(0, 5).map(book => ({
      ...book,
      resolvedCover: resolveCover(book) 
    }));

    setResults(topResults);
    setShowDropdown(true);
  };

  const handleResultClick = (book) => {
    setQuery(""); 
    setShowDropdown(false);
    navigate(`/book/${book.id}`, { state: { book } });
  };

  return (
    <header
      className="
        w-full 
        bg-[rgb(26,20,34)] 
        backdrop-blur-md   
        flex items-center px-6 py-4 
        shadow-stellar-violet border-b border-white/10
        relative z-50
      "
    >
      <div className="flex-1 max-w-3xl ml-6 relative" ref={searchRef}>
        <div className="relative w-full z-50">
          <input
            type="text"
            placeholder="Search title or author..."
            value={query}
            onChange={handleSearch}
            onFocus={() => { if(query) setShowDropdown(true); }}
            className="
              w-full p-2 pl-10 rounded-full 
              bg-white/10 text-white placeholder-stellar-dim 
              backdrop-blur-md 
              focus:ring-2 focus:ring-stellar-glow 
              focus:outline-none 
              transition-all duration-200
            "
          />
          <IoIosSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-white/80 text-xl" />
        </div>

        {/* --- DROPDOWN --- */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1422] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {results.length > 0 ? (
              <ul>
                {results.map((book) => (
                  <li
                    key={book.id}
                    onClick={() => handleResultClick(book)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                  >
                    {/* Cover Preview */}
                    <div className="w-10 h-14 bg-white/5 rounded overflow-hidden shrink-0 shadow-md relative">
                      {book.resolvedCover ? (
                        <img 
                          src={book.resolvedCover} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 bg-gray-800">
                          NO IMG
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm text-gray-100 font-medium truncate">
                        {book.title}
                      </span>
                      <span className="text-xs text-gray-400 truncate">
                        {book.author}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-4 text-center text-gray-500 text-sm">
                No books found.
              </div>
            )}
          </div>
        )}
      </div>

      <HeaderRight />
    </header>
  );
}