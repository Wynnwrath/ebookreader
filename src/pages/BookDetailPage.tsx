import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { 
  FiBookOpen, 
  FiHeart, 
  FiTrash2, 
  FiCalendar, 
  FiClock, 
  FiFileText, 
  FiChevronRight, 
  FiArrowLeft,
  FiBookmark,
  FiInfo,
  FiList,
  FiCheckCircle
} from "react-icons/fi";
import { invoke } from "@tauri-apps/api/core";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

interface BookDetails {
  id: number;
  title: string;
  author?: string;
  published_date?: string;
  publisher?: string;
  isbn?: string;
  file_type?: string;
  file_path: string;
  added_at?: string;
}

interface Chapter {
  title: string;
  id: string;
}

interface ReadingProgress {
  progress_percentage?: number;
  chapter_title?: string | null;
  page_number?: number | null;
  last_read_at?: string | null;
}

interface DetailOutletContext {
  userId: number | null;
}

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const context = useOutletContext<DetailOutletContext | null>();
  const userId = context?.userId ?? 1;

  // State
  const [book, setBook] = useState<BookDetails | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"about" | "chapters">("about");

  const loadBookData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      let details = await invoke<BookDetails | null>("get_book_details", { bookId: Number(id) }).catch(() => null);
      if (!details) {
        // Fallback mock book for development/browser testing
        details = {
          id: Number(id) || -1,
          title: Number(id) === -2 ? "The Great Gatsby" : "Five Fall Into Adventure",
          author: Number(id) === -2 ? "F. Scott Fitzgerald" : "Enid Blyton",
          publisher: "George Newnes Ltd.",
          published_date: "1940-05-12",
          isbn: "978-0-333-12345-6",
          file_type: "epub",
          file_path: "/books/adventure.epub",
          added_at: new Date(Date.now() - 5 * 86400000).toISOString()
        };
      }
      setBook(details);

      // 1. Fetch Cover image
      try {
        const coverBytes = await invoke<number[]>("get_cover_img", { bookId: details.id });
        if (coverBytes && coverBytes.length > 0) {
          const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
          setCoverUrl(URL.createObjectURL(blob));
        }
      } catch (e) {
        console.warn("Cover image not available:", e);
      }

      // 2. Fetch Favorites status
      const savedFavs = localStorage.getItem(`stellaron-favorites-${userId}`);
      if (savedFavs) {
        const favArray: number[] = JSON.parse(savedFavs);
        setIsFavorite(favArray.includes(details.id));
      }

      // 3. Fetch Reading Progress
      try {
        const prog = await invoke<ReadingProgress | null>("get_reading_progress", { 
          userId, 
          bookId: details.id 
        }).catch(() => null);
        
        if (prog) {
          setProgress(prog);
        } else {
          // Fallback mock progress
          setProgress({
            progress_percentage: details.id === -2 ? 35 : 68,
            chapter_title: details.id === -2 ? "Chapter 3" : "Chapter 1: The Caravan in the Woods",
            page_number: 12,
            last_read_at: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Failed to load reading progress:", e);
      }

      // 4. Fetch and Parse Chapters/Pages in memory
      if (details.file_type === "pdf") {
        try {
          const pageCount = await invoke<number>("get_pdf_page_count", { path: details.file_path });
          const parsedChaps: Chapter[] = [];
          for (let i = 1; i <= pageCount; i++) {
            parsedChaps.push({
              title: `Page ${i}`,
              id: `page-${i}`
            });
          }
          setChapters(parsedChaps);
        } catch (e) {
          console.warn("Failed to parse PDF page count:", e);
          setChapters([{ title: "Page 1", id: "page-1" }]);
        }
      } else {
        try {
          const epubHtml = await invoke<string>("read_epub", { path: details.file_path });
          const parser = new DOMParser();
          const doc = parser.parseFromString(epubHtml, "text/html");
          const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6, [class*='chapter'], [id*='chapter']"));
          const parsedChaps: Chapter[] = headings.map((h, idx) => {
            if (!h.id) {
              h.id = `chapter-heading-${idx}`;
            }
            return {
              title: h.textContent?.trim() || `Section ${idx + 1}`,
              id: h.id
            };
          }).filter(c => c.title.length > 0 && c.title.length < 120);
          
          if (parsedChaps.length > 0) {
            setChapters(parsedChaps);
          } else {
            throw new Error("No headings parsed");
          }
        } catch (e) {
          console.warn("Failed to parse EPUB chapters, using mock chapters:", e);
          setChapters([
            { title: "Chapter 1: The Caravan in the Woods", id: "chapter-1" },
            { title: "Chapter 2: An Unexpected Invitation", id: "chapter-2" },
            { title: "Chapter 3: Secret Trails", id: "chapter-3" },
            { title: "Chapter 4: The Discovery at Midnight", id: "chapter-4" },
            { title: "Chapter 5: Escaping the Trap", id: "chapter-5" },
            { title: "Chapter 6: Safe Return", id: "chapter-6" }
          ]);
        }
      }

    } catch (err) {
      console.error("Failed to load details page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookData();
  }, [id, userId]);

  const toggleFavorite = () => {
    if (!book) return;
    const bookId = book.id;
    const savedFavs = localStorage.getItem(`stellaron-favorites-${userId}`);
    const favSet = savedFavs ? new Set<number>(JSON.parse(savedFavs)) : new Set<number>();
    
    if (favSet.has(bookId)) {
      favSet.delete(bookId);
      setIsFavorite(false);
    } else {
      favSet.add(bookId);
      setIsFavorite(true);
    }
    localStorage.setItem(`stellaron-favorites-${userId}`, JSON.stringify(Array.from(favSet)));
  };

  const handleDelete = async () => {
    if (!book) return;
    if (window.confirm(`Are you sure you want to permanently delete "${book.title}" from your library?`)) {
      try {
        await invoke("remove_book", { bookId: book.id });
        navigate("/");
      } catch (e) {
        console.error("Failed to delete book:", e);
      }
    }
  };

  const handleStartReading = () => {
    if (!book) return;
    navigate(`/book/${book.id}`);
  };

  const handleChapterSelect = (chapterId: string) => {
    if (!book) return;
    navigate(`/book/${book.id}`, { state: { jumpToChapterId: chapterId } });
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-text-dim text-sm font-semibold animate-pulse">
        Fetching book details...
      </div>
    );
  }

  if (!book) return null;

  const percent = progress?.progress_percentage ? Math.round(progress.progress_percentage) : 0;
  const lastReadDate = progress?.last_read_at ? new Date(progress.last_read_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) : null;

  return (
    <div className="w-full space-y-8 p-margin-desktop max-w-container-max mx-auto page-transition pb-24 animate-fade-in duration-300">
      
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-text-dim hover:text-text hover:translate-x-[-2px] transition duration-200 cursor-pointer"
      >
        <FiArrowLeft className="w-4 h-4" />
        <span>Return to Library</span>
      </button>

      {/* Hero Glassmorphic Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low/60 backdrop-blur-md p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-xl">
        
        {/* Blurred ambient glow backdrop from cover */}
        {coverUrl && (
          <div 
            className="absolute inset-0 -z-10 opacity-[0.08] filter blur-3xl scale-125 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        )}

        {/* Cover Thumbnail on Left */}
        <div className="w-44 h-64 mx-auto md:mx-0 shrink-0 bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10 shadow-2xl relative group cursor-pointer transition-transform duration-300 hover:scale-[1.03]">
          {coverUrl ? (
            <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-high text-text-dim font-bold text-lg uppercase">
              EPUB
            </div>
          )}
        </div>

        {/* Meta Content on Right */}
        <div className="flex-1 flex flex-col justify-between text-center md:text-left min-w-0 space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-text tracking-tight leading-tight line-clamp-2">
              {book.title}
            </h1>
            <p className="text-base text-tertiary font-serif italic">
              by {book.author || "Unknown Author"}
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start text-[10px] font-bold text-text-dim uppercase tracking-wider">
              {book.publisher && (
                <span className="px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/10">
                  {book.publisher}
                </span>
              )}
              {book.published_date && (
                <span className="px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/10 flex items-center gap-1">
                  <FiCalendar /> {book.published_date}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/10 uppercase">
                {book.file_type || "EPUB"} Format
              </span>
            </div>
          </div>

          {/* Reading progress metric */}
          {percent > 0 ? (
            <div className="space-y-2 max-w-sm mx-auto md:mx-0">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-text">Reading Progress</span>
                <span className="text-tertiary">{percent}% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden border border-outline-variant/10">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" 
                  style={{ width: `${percent}%` }}
                />
              </div>
              {progress?.chapter_title && (
                <p className="text-[10px] text-text-dim italic truncate pl-0.5">
                  Currently at: {progress.chapter_title}
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-text-dim pl-0.5">
              You haven't started reading this book yet.
            </div>
          )}

          {/* Actions Row */}
          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
            <Button 
              onClick={handleStartReading}
              variant="primary"
              className="px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition duration-200 cursor-pointer"
            >
              <FiBookOpen className="w-4 h-4" />
              <span>{percent > 0 ? "Continue Reading" : "Start Reading"}</span>
            </Button>

            <button 
              onClick={toggleFavorite}
              className={`p-3 rounded-xl border transition duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97] ${
                isFavorite 
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-500" 
                  : "bg-surface-container border-outline-variant/15 text-text-dim hover:text-text hover:border-outline-variant/40"
              }`}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <FiHeart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            </button>

            <button 
              onClick={handleDelete}
              className="p-3 rounded-xl border bg-surface-container border-outline-variant/15 text-text-dim hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/10 transition duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
              title="Delete Book"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Main Info Tabbed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Tabs & Meta (takes 2 span) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md">
            
            {/* Tabs Header */}
            <div className="flex border-b border-outline-variant/15">
              <button 
                onClick={() => setActiveTab("about")}
                className={`px-5 py-3.5 text-xs font-bold border-b-2 transition duration-200 cursor-pointer flex items-center gap-2 ${
                  activeTab === "about" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-text-dim hover:text-text"
                }`}
              >
                <FiInfo className="w-4 h-4" />
                <span>About the Book</span>
              </button>
              <button 
                onClick={() => setActiveTab("chapters")}
                className={`px-5 py-3.5 text-xs font-bold border-b-2 transition duration-200 cursor-pointer flex items-center gap-2 ${
                  activeTab === "chapters" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-text-dim hover:text-text"
                }`}
              >
                <FiList className="w-4 h-4" />
                <span>Table of Contents ({chapters.length})</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 min-h-[300px]">
              
              {activeTab === "about" && (
                <div className="space-y-6 animate-fade-in duration-200">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-text">Synopsis & Commentary</h3>
                    <p className="text-xs text-text-dim leading-relaxed font-serif">
                      This EPUB archive contains the complete digital edition of {book.title}. Stellaron Reader processes the original text flow and styling dynamically, providing high-fidelity typography, customizable font weights, margin alignments, and multi-column pagination matching scholarly layout ethics.
                    </p>
                    <p className="text-xs text-text-dim leading-relaxed font-serif">
                      Open this book to access interactive bookmarks, note taking, theme overlays (sepia, dark, light), and fully integrated chapter navigation.
                    </p>
                  </div>

                  {/* Metadata fields list */}
                  <div className="border-t border-outline-variant/10 pt-6 space-y-4">
                    <h3 className="text-sm font-bold text-text">File & Import Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-outline-variant/5">
                        <span className="text-text-dim">ISBN</span>
                        <span className="font-mono font-bold text-text">{book.isbn || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-outline-variant/5">
                        <span className="text-text-dim">Date Added</span>
                        <span className="font-semibold text-text">
                          {book.added_at ? new Date(book.added_at).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-outline-variant/5 md:col-span-2">
                        <span className="text-text-dim shrink-0 pr-4">File Path</span>
                        <span className="font-mono text-[10px] text-text truncate max-w-md" title={book.file_path}>
                          {book.file_path}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "chapters" && (
                <div className="space-y-4 animate-fade-in duration-200">
                  {chapters.length === 0 ? (
                    <div className="text-xs text-text-dim italic text-center py-12">
                      No chapters detected in this archive file. Open the book to read from beginning.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                      {chapters.map((chap, idx) => (
                        <button
                          key={chap.id}
                          onClick={() => handleChapterSelect(chap.id)}
                          className="w-full text-left px-4 py-3 rounded-xl border border-outline-variant/10 hover:border-primary/30 bg-surface/50 hover:bg-primary/5 text-xs text-text-dim hover:text-text transition duration-200 flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate pr-2 font-serif">{chap.title}</span>
                          <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </Card>
        </div>

        {/* Right Columns - Progress Stats card (takes 1 span) */}
        <div className="space-y-6">
          <Card className="p-6 shadow-md space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-bold tracking-tight flex items-center gap-2 text-primary">
                <FiClock className="w-5 h-5" />
                <span>Reading Stats</span>
              </h3>
              <p className="text-xs text-text-dim">Insights on your journey through this book.</p>
            </div>

            <div className="space-y-3 py-4 border-y border-outline-variant/10">
              
              {percent > 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FiCheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text">Active Journey</div>
                      <div className="text-[10px] text-text-dim">You are actively reading this book</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                      <FiCalendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text">Last Read</div>
                      <div className="text-[10px] text-text-dim">{lastReadDate || "Recently"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary">
                      <FiBookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text">Bookmark Saved</div>
                      <div className="text-[10px] text-text-dim">Quick points bookmarked in pages</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-text-dim italic text-center py-6">
                  Start reading to generate reading analytics.
                </div>
              )}

            </div>

            <div className="pt-2 text-center text-[10px] text-text-dim uppercase tracking-wider">
              Stellaron Archive Service
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default BookDetailPage;
