import { useState, useEffect, useRef } from "react";
import { IoIosSearch } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core"; 
import HeaderRight from "./HeaderRight";

export default function Header({ onOpenSettings }) {
  const navigate = useNavigate();
  
  const [query, setQuery] = useState("");
  const [allBooks, setAllBooks] = useState([]);
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    async function loadBooks() {
      try {
        const raw = await invoke("list_books");
        const mapped = raw.map((b) => ({
          id: b.book_id,
          title: b.title || "Untitled",
          author: b.author || "Unknown",
          path: b.cover_image_path 
        }));
        setAllBooks(mapped);
      } catch (err) {
        console.error("Header search failed to load books:", err);
      }
    }
    loadBooks();

    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resolveCover = (book) => {
    const cached = localStorage.getItem(`book_cover_${book.id}`);
    if (cached) return cached;
    if (book.path) return convertFileSrc(book.path);
    return null;
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim() === "") {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const lowerVal = val.toLowerCase();
    const filtered = allBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(lowerVal) ||
        book.author.toLowerCase().includes(lowerVal)
    );

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
      className={`
        w-full 
        /* This uses your dark tinted header color */
        bg-header 
        border-b border-border 
        shadow-lg
        backdrop-blur-md   
        flex items-center px-6 py-4 
        relative z-50
      `}
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
              /* UPDATED: Theme Variables */
              bg-glass text-text placeholder:text-text-dim
              border border-transparent focus:border-primary
              backdrop-blur-md 
              focus:ring-2 focus:ring-primary/50 
              focus:outline-none 
              transition-all duration-200
            "
          />
          <IoIosSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-text-dim text-xl" />
        </div>

        {/* --- DROPDOWN --- */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-pop-in">
            {results.length > 0 ? (
              <ul>
                {results.map((book) => (
                  <li
                    key={book.id}
                    onClick={() => handleResultClick(book)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-glass cursor-pointer transition-colors border-b border-border last:border-0"
                  >
                    {/* Cover Preview */}
                    <div className="w-10 h-14 bg-glass rounded overflow-hidden shrink-0 shadow-md relative">
                      {book.resolvedCover ? (
                        <img 
                          src={book.resolvedCover} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-text-dim bg-bg">
                          NO IMG
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm text-text font-medium truncate">
                        {book.title}
                      </span>
                      <span className="text-xs text-text-dim truncate">
                        {book.author}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-4 text-center text-text-dim text-sm">
                No books found.
              </div>
            )}
          </div>
        )}
      </div>

      <HeaderRight onOpenSettings={onOpenSettings} />
    </header>
  );
}