import React, { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { tauriService } from "../services/tauriService";
import { TauriBook as SearchBook } from "../types";
import { useBookCovers } from "../hooks/useBookCovers";

interface SearchLibraryProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavigateToBook: (bookId: number) => void;
}

const SearchLibrary: React.FC<SearchLibraryProps> = ({
  searchQuery,
  setSearchQuery,
  onNavigateToBook,
}) => {
  const searchRef = useRef<HTMLDivElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchBooks, setSearchBooks] = useState<SearchBook[]>([]);
  const { covers: searchCovers, loadCovers } = useBookCovers();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadBooksForSearch = async () => {
    try {
      const list = await tauriService.listBooks();
      setSearchBooks(list as any);

      // Lazy load cover images for matching books via custom hook
      const ids = list.map(b => b.id);
      loadCovers(ids);
    } catch (err) {
      console.error("Failed to load search catalog:", err);
    }
  };

  const handleSearchItemClick = (bookId: number) => {
    onNavigateToBook(bookId);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const filteredBooks = searchBooks.filter((b) => {
    const titleMatch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || authorMatch;
  });

  return (
    <div ref={searchRef} className="relative w-64 md:w-80">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
      <input
        type="text"
        placeholder="Search your library..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => {
          setIsSearchFocused(true);
          loadBooksForSearch();
        }}
        className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-full py-2 pl-10 pr-4 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-all shadow-sm"
      />

      {/* Live Search Suggestions Dropdown Overlay */}
      {isSearchFocused && searchQuery.trim() !== "" && (
        <div className="absolute top-full left-0 mt-2 w-[340px] bg-surface-container border border-outline-variant/40 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-outline-variant/30 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container-high">
            Search Results
          </div>
          <div className="overflow-y-auto no-scrollbar flex-1 max-h-72">
            {filteredBooks.length === 0 ? (
              <div className="px-4 py-6 text-xs text-on-surface-variant text-center">
                No matching books found
              </div>
            ) : (
              filteredBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleSearchItemClick(book.id)}
                  className="px-3 py-2 flex items-center gap-3 hover:bg-surface-container-high cursor-pointer border-b border-outline-variant/20 last:border-0 transition text-on-surface"
                >
                  {searchCovers[book.id] ? (
                    <img
                      src={searchCovers[book.id]}
                      alt={book.title}
                      className="w-8 h-10 object-cover rounded shadow-sm border border-outline-variant/10"
                    />
                  ) : (
                    <div className="w-8 h-10 bg-surface-container-highest rounded flex items-center justify-center text-[10px] text-on-surface font-bold shadow-sm">
                      EPUB
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-on-surface truncate">{book.title}</h4>
                    <p className="text-[10px] text-on-surface-variant truncate">{book.author || "Unknown Author"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchLibrary;
