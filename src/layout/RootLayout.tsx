import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import SettingsModal from "../components/SettingsModal";
import { tauriService } from "../services/tauriService";
import { TauriBook as SearchBook } from "../types";
import { 
  FiHome, 
  FiBookOpen, 
  FiSettings, 
  FiHelpCircle,
  FiSearch,
  FiMonitor,
  FiSun,
  FiMoon,
  FiCoffee,
  FiFolder,
  FiPlus,
  FiZap,
  FiBell,
  FiHeart,
  FiUser,
  FiUploadCloud,
  FiTag,
  FiX,
  FiClock,
  FiFileText,
  FiCalendar
} from "react-icons/fi";

export interface RootLayoutProps {
  userId?: number | null;
}

const RootLayout: React.FC<RootLayoutProps> = ({ userId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTheme, setActiveTheme] = useState("discord-dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [importTrigger, setImportTrigger] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Import Modal State & Handlers
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; path: string } | null>(null);
  const [selectedTag, setSelectedTag] = useState("Reference");
  const [customTags, setCustomTags] = useState<string[]>(["Fiction", "Non-Fiction", "Reference", "Textbook"]);
  const [recentImports, setRecentImports] = useState<Array<{ name: string; time: string; tag: string }>>(() => {
    const saved = localStorage.getItem(`stellaron-recent-imports-${userId}`);
    if (saved) return JSON.parse(saved);
    return [
      { name: "The Design of Everyday Things.epub", time: "Added 2 hours ago", tag: "Design" },
      { name: "Typography_Guidelines_v2.pdf", time: "Added yesterday", tag: "Reference" }
    ];
  });

  // Search Overlay State & Functions
  const searchRef = useRef<HTMLDivElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchBooks, setSearchBooks] = useState<SearchBook[]>([]);
  const [searchCovers, setSearchCovers] = useState<Record<number, string>>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSidebarImport = () => {
    setShowImportModal(true);
  };

  const handleFileBrowse = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Ebook / Document", extensions: ["epub", "pdf"] }]
      });
      if (selected && typeof selected === "string") {
        const fileName = selected.split(/[\\/]/).pop() || "Unknown Ebook";
        setSelectedFile({ name: fileName, path: selected });
      }
    } catch (err) {
      console.error("Failed to select file:", err);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    try {
      await tauriService.importBook(selectedFile.path);
      
      const newImport = { 
        name: selectedFile.name, 
        time: "Added just now", 
        tag: selectedTag 
      };
      const updated = [newImport, ...recentImports].slice(0, 10);
      setRecentImports(updated);
      localStorage.setItem(`stellaron-recent-imports-${userId}`, JSON.stringify(updated));
      
      setImportTrigger(prev => prev + 1);
      setShowImportModal(false);
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to import book:", err);
      alert("Failed to import book. Please make sure it is a valid EPUB file.");
    }
  };

  const handleAddNewTag = () => {
    const tagName = prompt("Enter new tag name:");
    if (tagName && tagName.trim()) {
      const trimmed = tagName.trim();
      if (!customTags.includes(trimmed)) {
        setCustomTags(prev => [...prev, trimmed]);
        setSelectedTag(trimmed);
      }
    }
  };

  const loadBooksForSearch = async () => {
    try {
      const list = await tauriService.listBooks();
      setSearchBooks(list as any);

      // Lazy load cover images for matching books
      const newCovers = { ...searchCovers };
      for (const book of list) {
        if (!newCovers[book.id]) {
          try {
            const coverBytes = await tauriService.getCoverImg(book.id);
            if (coverBytes && coverBytes.length > 0) {
              const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
              newCovers[book.id] = URL.createObjectURL(blob);
            }
          } catch (e) {
            // Ignore cover load failures
          }
        }
      }
      setSearchCovers(newCovers);
    } catch (err) {
      console.error("Failed to load search catalog:", err);
    }
  };

  const handleSearchItemClick = (bookId: number) => {
    navigate(`/book-details/${bookId}`);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const filteredBooks = searchBooks.filter((b) => {
    const titleMatch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || authorMatch;
  });

  // Sync theme with document class list
  useEffect(() => {
    const savedTheme = localStorage.getItem("stellaron-theme") || "scholarly-dark";
    
    // Normalize theme
    let targetTheme = "scholarly-dark";
    if (savedTheme.includes("light")) {
      targetTheme = "scholarly-light";
    } else if (savedTheme.includes("sepia")) {
      targetTheme = "scholarly-sepia";
    }
    
    setActiveTheme(targetTheme);
    
    const root = document.documentElement;
    root.classList.remove("theme-scholarly-dark", "theme-scholarly-light", "theme-scholarly-sepia", "dark", "light");
    root.classList.add(`theme-${targetTheme}`);
    if (targetTheme === "scholarly-dark") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    let nextTheme = "scholarly-dark";
    if (activeTheme === "scholarly-dark") {
      nextTheme = "scholarly-sepia";
    } else if (activeTheme === "scholarly-sepia") {
      nextTheme = "scholarly-light";
    } else {
      nextTheme = "scholarly-dark";
    }
    
    setActiveTheme(nextTheme);
    localStorage.setItem("stellaron-theme", nextTheme);
    
    const root = document.documentElement;
    root.classList.remove("theme-scholarly-dark", "theme-scholarly-light", "theme-scholarly-sepia", "dark", "light");
    root.classList.add(`theme-${nextTheme}`);
    if (nextTheme === "scholarly-dark") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  };

  const navLinks = [
    { name: "Dashboard", path: "/", icon: FiHome },
    { name: "Catalog", path: "/library", icon: FiBookOpen },
    { name: "Collections", path: "/collections", icon: FiFolder },
    { name: "Profile", path: "/profile", icon: FiUser },
    { name: "Book Plans", path: "/plans", icon: FiCalendar },
  ];

  return (
    <div className="w-screen h-screen flex bg-bg text-on-surface overflow-hidden select-none">
      
      {/* 1. STITCH LUMINA SIDEBAR */}
      <aside className="w-[280px] bg-surface-container-low dark:bg-surface-container-lowest backdrop-blur-xl border-r border-outline-variant/20 shadow-sm flex flex-col py-8 px-6 gap-4 z-40 hidden md:flex shrink-0">
        
        {/* Workspace Brand Header with Avatar (Clickable to User Profile) */}
        <div 
          onClick={() => navigate("/profile")}
          className="flex items-center gap-4 mb-6 px-2 hover:opacity-85 transition-opacity cursor-pointer group/brand"
        >
          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0 border border-outline-variant/20 shadow-sm group-hover/brand:border-tertiary/50 transition-colors">
            <img 
              alt="User profile" 
              className="w-full h-full object-cover group-hover/brand:scale-105 transition-transform duration-300" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBveH3j_jLDZyg3rMUr2yCa7_K0L-tyGFZX_4vii0oKdzKquuj16Hfate6qfnChTH-GFBrWavsWF_-2WQO5MBEcOO5EO23UyHJaIx4EymeqhsS1KJnVRLDfugyg7zQASb4jqwcw5NRZO0h0IfZCUBWuT3MlC_o8eybfZgsXyILOMzm4gDjp8qYF6WEE9XuCzYmWW2TyMH6kzKXot9mZj4l0lrM0ka747PcJ7bd3xVGKx5lmkhmXFPvx9t_gV4HLdDFha2HnjCA98Cw"
            />
          </div>
          <div>
            <h1 className="font-headline-md text-[20px] font-bold text-on-surface leading-tight group-hover/brand:text-tertiary transition-colors">Stellaron</h1>
            <p className="font-label-sm text-[11px] text-on-surface-variant/75 uppercase tracking-widest leading-none mt-0.5">Private Archive</p>
          </div>
        </div>

        {/* Import Book CTA */}
        <button 
          onClick={handleSidebarImport}
          className="w-full bg-tertiary/15 text-tertiary border border-tertiary/30 hover:bg-tertiary/25 hover:border-tertiary transition-all duration-200 py-3 px-4 rounded-lg font-label-md text-label-md mb-4 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <FiPlus className="w-4.5 h-4.5" />
          <span>Import Book</span>
        </button>

        {/* Sidebar Navigation */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-label-md transition-all duration-300 group ${
                  isActive 
                    ? "text-tertiary font-bold bg-surface-container dark:bg-surface-container-high/60 scale-98" 
                    : "text-on-surface-variant font-medium hover:bg-surface-container-high/40 hover:text-tertiary"
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-tertiary" : "text-on-surface-variant/70 group-hover:text-tertiary"} transition-colors`} />
                  <span>{link.name}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings Footer link */}
        <div className="mt-auto pt-4 border-t border-outline-variant/15">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high/40 hover:text-tertiary transition-colors cursor-pointer text-left"
          >
            <FiSettings className="w-5 h-5" />
            <span className="font-label-md">Settings</span>
          </button>
        </div>

      </aside>

      {/* 2. MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Panel */}
        <header className="h-16 px-margin-desktop border-b border-outline-variant/10 bg-surface-container/60 dark:bg-surface-container-lowest/60 backdrop-blur-xl flex items-center justify-between shadow-sm shrink-0 z-30">
          
          {/* Search Bar */}
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
                        className="px-3 py-2 flex items-center gap-3 hover:bg-surface-container-high cursor-pointer border-b border-outline-variant/20 last:border-0 transition"
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

          {/* Right Header Controls (Streak, Notifications, Theme) */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Streak Badge */}
            <div className="flex items-center gap-2 text-tertiary font-label-md text-[13px] bg-tertiary/10 border border-tertiary/20 px-3.5 py-1.5 rounded-full shadow-sm">
              <FiZap className="w-4 h-4 text-tertiary fill-current" />
              <span className="font-semibold">14 Day Streak</span>
            </div>

            {/* Theme & Notifications */}
            <div className="flex items-center gap-2 text-on-surface-variant">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-surface-container-high hover:text-tertiary transition-colors cursor-pointer relative"
                title={
                  activeTheme === "scholarly-dark"
                    ? "Switch to Sepia Theme"
                    : activeTheme === "scholarly-sepia"
                    ? "Switch to Light Theme"
                    : "Switch to Dark Theme"
                }
              >
                {activeTheme === "scholarly-light" ? (
                  <FiSun className="w-5 h-5 text-tertiary" />
                ) : activeTheme === "scholarly-sepia" ? (
                  <FiCoffee className="w-5 h-5 text-primary" />
                ) : (
                  <FiMoon className="w-5 h-5 text-on-surface-variant" />
                )}
              </button>

              <button className="p-2 rounded-full hover:bg-surface-container-high hover:text-tertiary transition-colors">
                <FiBell className="w-5 h-5 block" />
              </button>
            </div>
          </div>

        </header>

        {/* Dynamic Inner Page viewport */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-bg relative">
          <Outlet context={{ searchQuery, setSearchQuery, userId, importTrigger }} />
        </main>

      </div>

      {/* 2. IMPORT LIBRARY MODAL OVERLAY */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-backdrop">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-[540px] shadow-2xl overflow-hidden relative p-8 flex flex-col gap-6 animate-zoom-in-modal max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowImportModal(false);
                setSelectedFile(null);
              }}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Title & Subtitle */}
            <div className="text-center">
              <h2 className="text-3xl font-serif text-on-surface tracking-tight mt-1">Import Library</h2>
              <p className="text-xs text-on-surface-variant font-medium mt-1">
                Add new titles to your Lumina Reader collection.
              </p>
            </div>

            {/* Drag & Drop Box */}
            <div 
              onClick={handleFileBrowse}
              className="border border-dashed border-outline-variant/40 hover:border-tertiary/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3.5 transition-colors bg-surface-container-low/40 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-full bg-surface-container-high border border-outline-variant/15 flex items-center justify-center text-on-surface-variant shadow-sm group-hover:bg-surface-container-highest transition-colors">
                <FiUploadCloud className="w-5 h-5 text-on-surface-variant/80" />
              </div>
              <div className="text-center space-y-0.5">
                <h3 className="font-headline-sm text-sm font-bold text-on-surface tracking-tight">
                  Drag & drop files here
                </h3>
                <p className="font-body-md text-[11px] text-on-surface-variant/70">
                  or click to browse your local directory
                </p>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileBrowse();
                }}
                className="px-5 py-1.5 rounded-full bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant/20 font-bold text-xs text-on-surface transition-all active:scale-98 shadow-sm"
              >
                Browse Files
              </button>
              
              {/* Allowed extensions indicator */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/15 text-[8px] font-bold tracking-wider text-on-surface-variant/60 uppercase">EPUB</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/15 text-[8px] font-bold tracking-wider text-on-surface-variant/60 uppercase">PDF</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/15 text-[8px] font-bold tracking-wider text-on-surface-variant/60 uppercase">MOBI</span>
              </div>

              {/* Selected file preview */}
              {selectedFile && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 text-xs font-semibold text-tertiary bg-tertiary/10 border border-tertiary/20 px-3 py-1.5 rounded-lg flex items-center gap-2 max-w-full truncate shadow-sm animate-in fade-in"
                >
                  <FiFileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{selectedFile.name}</span>
                </div>
              )}
            </div>

            {/* Categorize Section */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/90 tracking-wider uppercase">
                <FiTag className="w-3.5 h-3.5 text-on-surface-variant/60" />
                <span>Categorize Import</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {customTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                        isSelected
                          ? "bg-on-surface text-surface border-on-surface shadow-sm font-extrabold"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
                <button
                  onClick={handleAddNewTag}
                  className="px-3 py-1.5 rounded-full border border-dashed border-outline-variant/40 bg-transparent text-on-surface-variant hover:text-tertiary hover:border-tertiary/60 transition-all text-[11px] font-bold"
                >
                  + New Tag
                </button>
              </div>
            </div>

            {/* Footer with Info and Buttons */}
            <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
              <p className="text-[10px] text-on-surface-variant/70 font-semibold">
                Files will be encrypted and stored locally.
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={!selectedFile}
                  className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                    selectedFile
                      ? "bg-tertiary text-on-tertiary hover:bg-tertiary/90 hover:shadow active:scale-98 cursor-pointer"
                      : "bg-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed"
                  }`}
                >
                  <span>Confirm Import</span>
                  <span className="text-sm font-bold leading-none">→</span>
                </button>
              </div>
            </div>

            {/* Recent Imports Section */}
            {recentImports.length > 0 && (
              <div className="border-t border-outline-variant/10 pt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/90 tracking-wider uppercase">
                  <FiClock className="w-3.5 h-3.5" />
                  <span>Recent Imports</span>
                </div>
                <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto no-scrollbar">
                  {recentImports.map((imp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-surface-container-low/40 border border-outline-variant/10 p-2.5 rounded-lg hover:border-outline-variant/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface-variant/80 border border-outline-variant/10 shadow-sm shrink-0">
                        <FiFileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{imp.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                          {imp.time} &bull; <span className="text-tertiary font-bold">{imp.tag}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </div>
  );
};

export default RootLayout;
