import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate, useSearchParams } from "react-router-dom";
import { 
  FiGrid, 
  FiList, 
  FiHeart, 
  FiCheckCircle, 
  FiBookOpen, 
  FiClock,
  FiPlus, 
  FiFolder,
  FiArrowUp,
  FiArrowDown,
  FiTrash2
} from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import BookCard, { Book } from "../components/ui/BookCard";
import { tauriService } from "../services/tauriService";
import { TauriBook, ProgressItem, AppOutletContext } from "../types";
import { useBooksWithProgress } from "../hooks/useBooksWithProgress";
import { useBookCovers } from "../hooks/useBookCovers";
import { useImport } from "../hooks/useImport";
import { useFavorites } from "../hooks/useFavorites";

interface LibraryBook extends Book {
  category: string;
}

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { searchQuery, userId, importTrigger } = useOutletContext<AppOutletContext>();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);

  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);
  const [sortBy, setSortBy] = useState<string>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Custom Hooks
  const { books: rawBooks, loading: loadingBooks, loadData } = useBooksWithProgress(userId);
  const { covers, loading: loadingCovers, loadCovers } = useBookCovers();
  const { handleImport, handleImportFolder } = useImport({
    onSuccess: () => loadData(true)
  });
  const { favorites, toggleFavorite: toggleFavoriteHook } = useFavorites(userId);

  // Derive final books for Library page
  const books: LibraryBook[] = rawBooks.map(b => {
    let category = "all";
    if (b.progress === 100) {
      category = "completed";
    } else if (b.progress > 0) {
      category = "reading";
    }
    return {
      ...b,
      category,
      favorite: favorites.has(b.id)
    };
  });

  // Load covers when books change
  useEffect(() => {
    if (rawBooks.length > 0) {
      loadCovers(rawBooks.map(b => b.id));
    }
  }, [rawBooks, loadCovers]);

  // Sync with main collections reload on parent triggers
  useEffect(() => {
    if (userId) {
      loadData(true);
    }
  }, [userId, importTrigger]);

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteHook(id);
  };

  const handleDeleteBook = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await tauriService.removeBook(id);
        await loadData(true);
      } catch (err) {
        console.error("Failed to delete book:", err);
      }
    }
  };

  // Filter books
  const filteredBooks = books.filter(book => {
    const query = searchQuery || "";
    const matchesSearch = 
      book.title.toLowerCase().includes(query.toLowerCase()) || 
      book.author.toLowerCase().includes(query.toLowerCase());
    
    if (activeCategory === "favorites") {
      return matchesSearch && book.favorite;
    } else if (activeCategory === "reading") {
      return matchesSearch && book.progress > 0 && book.progress < 100;
    } else if (activeCategory === "completed") {
      return matchesSearch && book.progress === 100;
    }
    return matchesSearch;
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "title") {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === "author") {
      comparison = a.author.localeCompare(b.author);
    } else if (sortBy === "progress") {
      comparison = a.progress - b.progress;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  if (loadingBooks || loadingCovers) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-text-dim text-sm font-semibold">
        Loading library catalog...
      </div>
    );
  }

  const getHeaderInfo = () => {
    switch (activeCategory) {
      case "reading":
        return {
          title: "Books in Progress",
          subtitle: "Resume reading your currently active volumes.",
          icon: FiClock,
          iconClass: "text-primary",
        };
      case "completed":
        return {
          title: "Completed Volumes",
          subtitle: "Revisit the books you have read to completion.",
          icon: FiCheckCircle,
          iconClass: "text-tertiary",
        };
      case "favorites":
        return {
          title: "Favorite Books",
          subtitle: "Your curated collection of beloved stories and references.",
          icon: FiHeart,
          iconClass: "text-red-500/90 fill-current",
        };
      default:
        return {
          title: "Library Catalogue",
          subtitle: "Manage and read your collection of local EPUB files.",
          icon: FiFolder,
          iconClass: "text-primary",
        };
    }
  };

  const header = getHeaderInfo();
  const HeaderIcon = header.icon;

  return (
    <div className="w-full space-y-6 p-margin-desktop max-w-container-max mx-auto page-transition pb-24">
      
      {/* Top Controls section (No page title/description to match native app feel) */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div />

        <div className="flex items-center gap-3">
          {/* Categories Tab */}
          <div className="flex bg-surface-container border border-outline-variant/15 p-0.5 rounded-lg text-xs font-semibold shrink-0">
            {[
              { id: "all", label: "All Books" },
              { id: "reading", label: "Reading" },
              { id: "completed", label: "Completed" },
              { id: "favorites", label: "Favorites" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-md transition cursor-pointer ${
                  activeCategory === tab.id ? "bg-tertiary text-surface-container-lowest font-bold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleImport}
            className="font-semibold text-xs py-1.5 px-4 bg-tertiary text-surface-container-lowest hover:bg-tertiary/90 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Import a single EPUB file"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Import File</span>
          </button>
          <button
            onClick={handleImportFolder}
            className="font-semibold text-xs py-1.5 px-4 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/35 text-on-surface rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Import an entire directory containing EPUB files"
          >
            <FiFolder className="w-3.5 h-3.5" />
            <span>Import Folder</span>
          </button>
        </div>
      </section>

      {/* Sorting, Grid Switcher and Counts */}
      <section className="flex flex-wrap items-center justify-between gap-4 p-3 bg-surface border border-border rounded-xl text-xs font-medium">
        <div className="text-text-dim">
          Found <span className="text-text font-bold">{sortedBooks.length}</span> books
        </div>

        <div className="flex items-center gap-4">
          {/* Sorting controls */}
          <div className="flex items-center gap-1">
            <span className="text-text-dim">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-bg border border-border text-text rounded px-2 py-1 focus:outline-none focus:border-primary text-xs"
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="progress">Progress</option>
            </select>
            <button 
              onClick={toggleSortOrder}
              className="p-1.5 rounded border border-border hover:bg-glass text-text cursor-pointer"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              {sortOrder === "asc" ? <FiArrowUp className="w-3.5 h-3.5" /> : <FiArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-border hidden sm:block" />

          {/* Grid/List switchers */}
          <div className="flex bg-bg border border-border p-0.5 rounded">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-sm transition cursor-pointer ${
                viewMode === "grid" ? "bg-primary/20 text-primary" : "text-text-dim hover:text-text"
              }`}
              title="Grid View"
            >
              <FiGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-sm transition cursor-pointer ${
                viewMode === "list" ? "bg-primary/20 text-primary" : "text-text-dim hover:text-text"
              }`}
              title="List View"
            >
              <FiList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Book Grid / List Output */}
      {sortedBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-border rounded-2xl bg-surface/50 text-center space-y-3">
          <FiBookOpen className="w-12 h-12 text-text-dim opacity-40 animate-pulse" />
          <h3 className="font-bold text-lg">No books found</h3>
          <p className="text-xs text-text-dim max-w-sm">No items matched your current filter or search queries. Import a new book or check your search query.</p>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleImport}
              leftIcon={FiPlus}
              size="sm"
              className="font-semibold"
            >
              Import File
            </Button>
            <Button
              onClick={handleImportFolder}
              leftIcon={FiFolder}
              size="sm"
              variant="secondary"
              className="font-semibold"
            >
              Import Folder
            </Button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
          {sortedBooks.map((book, idx) => (
            <BookCard
              key={book.id}
              book={book}
              cover={covers[book.id]}
              variant="grid"
              animate={true}
              stagger={(idx % 5) + 1}
              favorite={book.favorite}
              onToggleFavorite={toggleFavorite}
              onDelete={handleDeleteBook}
              onClick={() => navigate(`/book-details/${book.id}`)}
            />
          ))}
        </div>
      ) : (
        
        /* List Layout */
        <div className="space-y-3">
          {sortedBooks.map((book, idx) => (
            <BookCard
              key={book.id}
              book={book}
              cover={covers[book.id]}
              variant="list"
              animate={true}
              stagger={(idx % 5) + 1}
              favorite={book.favorite}
              onToggleFavorite={toggleFavorite}
              onDelete={handleDeleteBook}
              onClick={() => navigate(`/book-details/${book.id}`)}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default LibraryPage;
