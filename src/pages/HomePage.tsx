import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { open, message } from "@tauri-apps/plugin-dialog";
import { 
  FiPlay, 
  FiPlus, 
  FiClock, 
  FiZap,
  FiBookOpen,
  FiBook,
  FiChevronRight,
  FiStar,
  FiCalendar,
  FiActivity,
  FiTrendingUp,
  FiBookmark,
  FiFolder
} from "react-icons/fi";
import { tauriService } from "../services/tauriService";
import { TauriBook, ProgressItem, Book, Annotation, ExtendedAnnotation, Collection } from "../types";

interface OutletContextType {
  userId: number | null;
  importTrigger: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { userId, importTrigger } = useOutletContext<OutletContextType>();

  const [books, setBooks] = useState<Book[]>([]);
  const [covers, setCovers] = useState<Record<number, string>>({});
  const [streakDays, setStreakDays] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentAnnotations, setRecentAnnotations] = useState<ExtendedAnnotation[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const defaultCollections: Collection[] = [
    {
      id: "philosophy",
      name: "Philosophy & Ethics",
      description: "Meditations on existence, morality, and the nature of consciousness.",
      accentColor: "border-tertiary text-tertiary",
      bookIds: [],
      coverImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "science",
      name: "Science & Nature",
      description: "Exploring the cosmos, evolution, and the natural laws that govern our reality.",
      accentColor: "border-secondary text-secondary",
      bookIds: [],
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "fiction",
      name: "Literary Fiction",
      description: "Masterpieces of narrative voice, character depth, and linguistic beauty.",
      accentColor: "border-primary text-primary",
      bookIds: [],
      coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "history",
      name: "Historical Archives",
      description: "Primary sources, biographies, and global histories spanning Antiquity to the Modern Era.",
      accentColor: "border-outline text-on-surface-variant",
      bookIds: [],
      coverImage: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&w=1200&q=80"
    }
  ];

  const loadCollections = () => {
    const saved = localStorage.getItem(`stellaron-collections-${userId}`);
    if (saved) {
      try {
        const parsed: Collection[] = JSON.parse(saved);
        const migrated = parsed.map(c => {
          const matchingDefault = defaultCollections.find(d => d.id === c.id);
          if (matchingDefault) {
            return {
              ...matchingDefault,
              bookIds: c.bookIds,
            };
          }
          return c;
        });
        setCollections(migrated);
      } catch (e) {
        setCollections(defaultCollections);
      }
    } else {
      setCollections(defaultCollections);
    }
  };

  const literaryQuotes = [
    { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" },
    { text: "A room without books is like a body without a soul.", author: "Cicero" },
    { text: "Books are a uniquely portable magic.", author: "Stephen King" },
    { text: "Reading is a conversation. All books talk. But a good book listens as well.", author: "Mark Haddon" },
    { text: "Quiet rooms, full of books, are the best places in the world.", author: "Charles Dickens" }
  ];

  const [currentQuote] = useState<{ text: string; author: string }>(
    () => literaryQuotes[Math.floor(Math.random() * literaryQuotes.length)]
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const allBooks = await tauriService.listBooks();
      
      const progressPromises = allBooks.map(async (b) => {
        try {
          const p = await tauriService.getReadingProgress<ProgressItem | null>({ bookId: b.id });
          return p;
        } catch {
          return null;
        }
      });
      const progressResults = await Promise.all(progressPromises);
      const allProgress = progressResults.filter((p): p is ProgressItem => p !== null);

      const progressMap: Record<number, ProgressItem> = {};
      allProgress.forEach((p) => {
        progressMap[p.book_id] = p;
      });

      // Format books list
      const booksWithProgress: Book[] = allBooks.map((b) => {
        const prog = progressMap[b.id];
        return {
          id: b.id,
          title: b.title,
          author: b.author || "Unknown Author",
          progress: prog ? Math.round(prog.progress_percentage || 0) : 0,
          lastReadAt: prog ? prog.last_read_at : null,
          lastRead: prog ? formatLastRead(prog.last_read_at) : "Never read",
        };
      });

      // Sort: books with recent progress first
      const sorted = [...booksWithProgress].sort((a, b) => {
        const aTime = a.lastReadAt ? new Date(a.lastReadAt.replace(" ", "T")).getTime() : 0;
        const bTime = b.lastReadAt ? new Date(b.lastReadAt.replace(" ", "T")).getTime() : 0;
        if (aTime && bTime) return bTime - aTime;
        if (aTime) return -1;
        if (bTime) return 1;
        return a.title.localeCompare(b.title);
      });

      setBooks(sorted);

      // Streak days calculations
      const streak = calculateStreak(allProgress);
      setStreakDays(streak);

      // Fetch covers for the books
      const newCovers: Record<number, string> = {};
      for (const book of allBooks) {
        try {
          const coverBytes = await tauriService.getCoverImg(book.id);
          if (coverBytes && coverBytes.length > 0) {
            const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
            newCovers[book.id] = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.error(`Failed to load cover for book ${book.id}:`, e);
        }
      }
      setCovers(newCovers);

      // Fetch annotations for the top 3 recently active books
      const annotationPromises = sorted.slice(0, 3).map(async (b) => {
        try {
          const annList = await tauriService.getAnnotations({ bookId: b.id });
          return annList.map(ann => ({ ...ann, bookTitle: b.title, bookAuthor: b.author }));
        } catch {
          return [];
        }
      });
      const annotationLists = await Promise.all(annotationPromises);
      const allAnnotations = annotationLists.flat();
      const sortedAnnotations = allAnnotations.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at.replace(" ", "T")).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at.replace(" ", "T")).getTime() : 0;
        return bTime - aTime;
      });
      setRecentAnnotations(sortedAnnotations.slice(0, 3));

    } catch (err) {
      console.error("Failed to load homepage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      const isInitial = books.length === 0;
      loadData(!isInitial);
      loadCollections();
    }
  }, [userId, importTrigger]);

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Ebook / Document", extensions: ["epub", "pdf"] }]
      });
      if (selected && typeof selected === "string") {
        await tauriService.importBook(selected);
        await loadData(true);
      }
    } catch (err) {
      console.error("Failed to import book:", err);
      await message(
        typeof err === "string" ? err : String(err),
        { title: "Import Failed", kind: "error" }
      );
    }
  };

  const handleImportFolder = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true
      });
      if (selected && typeof selected === "string") {
        const errors = await tauriService.scanBooksDirectory(selected);
        await loadData(true);
        if (errors && errors.length > 0) {
          await message(
            `Imported books, but some files failed to import:\n\n${errors.join("\n")}`,
            { title: "Folder Import Warning", kind: "warning" }
          );
        }
      }
    } catch (err) {
      console.error("Failed to import folder:", err);
      await message(
        typeof err === "string" ? err : String(err),
        { title: "Folder Import Failed", kind: "error" }
      );
    }
  };

  function formatLastRead(dateStr: string | null | undefined): string {
    if (!dateStr) return "Never read";
    try {
      const dt = new Date(dateStr.replace(" ", "T"));
      const diffMs = new Date().getTime() - dt.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays === 1) return "Yesterday";
      return `${diffDays} days ago`;
    } catch {
      return dateStr;
    }
  }

  function calculateStreak(progressList: ProgressItem[]): number {
    const dates = progressList
      .map((p) => (p.last_read_at ? p.last_read_at.split(" ")[0] : null))
      .filter((d): d is string => d !== null);
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();
    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    const dateToYMD = (d: Date) => d.toISOString().split("T")[0];

    const todayStr = dateToYMD(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = dateToYMD(yesterday);

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0;
    }

    let checkDate = new Date(uniqueDates[0]);
    let currentIdx = 0;

    while (currentIdx < uniqueDates.length) {
      const checkStr = dateToYMD(checkDate);
      if (uniqueDates[currentIdx] === checkStr) {
        streak++;
        currentIdx++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }

  const displayReadingBooks = books.filter(b => b.progress > 0 && b.progress < 100);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-on-surface-variant text-sm font-semibold">
        Loading desk...
      </div>
    );
  }

  return (
    <div className="p-margin-desktop space-y-12 max-w-container-max mx-auto w-full page-transition pb-24 text-on-surface">
      
      {/* 0. Header Greeting */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-on-surface tracking-tight">
            {getGreeting()}, <span className="text-tertiary font-display">Reader</span>
          </h1>
          <p className="font-sans text-sm text-on-surface-variant/80 mt-1.5">
            Welcome back to your reading desk. You have {books.length} {books.length === 1 ? "book" : "books"} in your private archive.
          </p>
        </div>
        
        {/* Date Display */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface-container-high/40 border border-outline-variant/15 text-xs font-semibold text-on-surface-variant shadow-sm">
          <FiCalendar className="w-4 h-4 text-tertiary" />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </section>

      {/* 1. Continue Reading / My books */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
          <h2 className="font-serif text-2xl font-bold text-on-surface">Active Desk</h2>
          {books.length > 0 && (
            <button 
              onClick={() => navigate("/library")}
              className="font-sans text-xs text-on-surface-variant/85 hover:text-tertiary transition-colors flex items-center gap-1 font-bold cursor-pointer"
            >
              View Full Catalog <FiChevronRight className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {displayReadingBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayReadingBooks.map((book) => (
              <div 
                key={book.id}
                onClick={() => {
                  navigate(`/book/${book.id}`);
                }}
                className="group flex gap-5 bg-surface-container-low/30 border border-outline-variant/10 rounded-2xl p-4 hover:bg-surface-container-low/80 hover:border-outline-variant/20 transition-all duration-300 shadow-sm cursor-pointer relative overflow-hidden"
              >
                {/* Cover art on the left with hover overlay */}
                <div className="w-[100px] sm:w-[110px] aspect-[2/3] rounded-xl overflow-hidden border border-outline-variant/20 shadow-md shrink-0 bg-surface-container relative">
                  {covers[book.id] ? (
                    <img 
                      alt={book.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300 cover-image" 
                      src={covers[book.id]} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiBookOpen className="text-on-surface-variant/30 w-8 h-8" />
                    </div>
                  )}
                  {/* Subtle Play Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition duration-300">
                      <FiPlay className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Details on the right */}
                <div className="flex-1 flex flex-col justify-between self-stretch py-1 min-w-0">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-bold text-on-surface leading-tight group-hover:text-tertiary transition-colors line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="font-sans text-xs text-on-surface-variant/75 truncate mt-0.5">
                      {book.author}
                    </p>
                  </div>

                  <div className="space-y-3 mt-auto">
                    {/* Progress details & solid indicator line */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800/80 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-tertiary rounded-full transition-all duration-300" 
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-on-surface-variant/70 font-bold tracking-wide">
                        <span>{book.progress}% COMPLETED</span>
                        {book.lastRead && <span>{book.lastRead.toUpperCase()}</span>}
                      </div>
                    </div>

                    {/* Resume Text Link */}
                    <span className="text-[11px] font-bold text-tertiary flex items-center gap-1.5 group-hover:text-tertiary/90 transition-colors">
                      <span>Resume Reading</span>
                      <FiChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-outline-variant/20 rounded-2xl bg-surface-container-low/20 text-center space-y-4">
            <div className="p-4 rounded-full bg-surface-container-high border border-outline-variant/10 text-on-surface-variant">
              <FiBookOpen className="w-8 h-8 opacity-60" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-on-surface">Your reading desk is empty</h3>
              <p className="text-xs text-on-surface-variant/80 max-w-sm">
                {books.length > 0 
                  ? "Go to your library and open a book to start tracking your progress here."
                  : "Import your first EPUB or PDF book to start reading and tracking progress."
                }
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {books.length > 0 ? (
                <button
                  onClick={() => navigate("/library")}
                  className="font-semibold text-xs py-2 px-4 bg-tertiary text-surface-container-lowest hover:bg-tertiary/90 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm animate-pop-in"
                >
                  <span>Go to Library</span>
                  <FiChevronRight className="w-4.5 h-4.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={handleImport}
                    className="font-semibold text-xs py-2 px-4 bg-tertiary text-surface-container-lowest hover:bg-tertiary/90 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Import File</span>
                  </button>
                  <button
                    onClick={handleImportFolder}
                    className="font-semibold text-xs py-2 px-4 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/35 text-on-surface rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <FiFolder className="w-4 h-4" />
                    <span>Import Folder</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Collections & Curations Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
          <h2 className="font-serif text-2xl font-bold text-on-surface">Collections & Curations</h2>
          <button 
            onClick={() => navigate("/collections")}
            className="font-sans text-xs text-on-surface-variant/85 hover:text-tertiary transition-colors flex items-center gap-1 font-bold cursor-pointer"
          >
            Manage Collections <FiChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.length <= 4 ? (
            collections.map((col) => (
              <div 
                key={col.id}
                onClick={() => navigate("/collections", { state: { activeCollectionId: col.id } })}
                className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 bg-surface-container-low shadow-sm"
              >
                {col.coverImage ? (
                  <img 
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity" 
                    alt={`${col.name} cover`}
                    src={col.coverImage}
                  />
                ) : (
                  <div className={`absolute inset-0 opacity-20 ${col.accentColor.split(" ")[0]}`}></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface/40 to-transparent"></div>
                
                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border bg-surface-container/60 ${col.accentColor}`}>
                      {col.bookIds.length} VOLUMES
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-base font-bold text-on-surface truncate group-hover:text-tertiary transition-colors">{col.name}</h3>
                    <p className="text-xs text-on-surface-variant/90 truncate mt-1">{col.description || "Curated book list."}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {collections.slice(0, 3).map((col) => (
                <div 
                  key={col.id}
                  onClick={() => navigate("/collections", { state: { activeCollectionId: col.id } })}
                  className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 bg-surface-container-low shadow-sm"
                >
                  {col.coverImage ? (
                    <img 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity" 
                      alt={`${col.name} cover`}
                      src={col.coverImage}
                    />
                  ) : (
                    <div className={`absolute inset-0 opacity-20 ${col.accentColor.split(" ")[0]}`}></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface/40 to-transparent"></div>
                  
                  <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border bg-surface-container/60 ${col.accentColor}`}>
                        {col.bookIds.length} VOLUMES
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-base font-bold text-on-surface truncate group-hover:text-tertiary transition-colors">{col.name}</h3>
                      <p className="text-xs text-on-surface-variant/90 truncate mt-1">{col.description || "Curated book list."}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* More Collections Card */}
              <div 
                onClick={() => navigate("/collections")}
                className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-outline-variant/15 border-dashed bg-surface-container-low/40 hover:bg-surface-container-high/60 transition-all duration-500 flex flex-col items-center justify-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/10 group-hover:bg-tertiary/10 transition-colors">
                  <FiChevronRight className="text-lg text-on-surface-variant group-hover:text-tertiary transition-colors" />
                </div>
                <span className="font-semibold text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  + {collections.length - 3} More Collections
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 2. Reader's Journal & Reflections */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 columns: Reader's Notebook (Recent Highlights & Annotations) */}
        <div className="lg:col-span-2 bg-surface-container-low/50 border border-outline-variant/15 rounded-2xl p-6 space-y-6 flex flex-col justify-between min-h-[300px]">
          <div className="space-y-2">
            <h2 className="text-xl font-serif font-bold text-on-surface flex items-center gap-2.5">
              <FiBookmark className="text-tertiary w-5 h-5" />
              <span>Reader's Journal</span>
            </h2>
            <p className="text-xs text-on-surface-variant/75 font-sans">
              A curated feed of your latest thoughts, highlighted passages, and bookmarks.
            </p>
          </div>

          {recentAnnotations.length > 0 ? (
            <div className="space-y-4 flex-1 mt-4">
              {recentAnnotations.map((annotation) => (
                <div 
                  key={annotation.id}
                  onClick={() => navigate(`/book-details/${annotation.book_id}`)}
                  className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/10 hover:border-tertiary/30 hover:bg-surface-container transition-all duration-200 cursor-pointer space-y-2"
                >
                  <div className="flex justify-between items-center text-[10px] font-sans text-on-surface-variant/60 font-bold">
                    <span>{annotation.bookTitle} &bull; {annotation.chapter_title || "General"}</span>
                    <span>{annotation.created_at ? formatLastRead(annotation.created_at) : ""}</span>
                  </div>
                  {annotation.highlighted_text && (
                    <blockquote className="font-serif italic text-sm text-on-surface border-l-2 border-tertiary pl-3 py-0.5 leading-relaxed line-clamp-2">
                      "{annotation.highlighted_text}"
                    </blockquote>
                  )}
                  {annotation.note && (
                    <p className="text-xs text-on-surface-variant font-sans bg-surface-container-high/40 p-2 rounded-lg border border-outline-variant/5">
                      <span className="font-bold text-[10px] uppercase text-tertiary block mb-1">Your Note</span>
                      {annotation.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Literary Quote Fallback */
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 mt-4 rounded-xl border border-dashed border-outline-variant/20 bg-surface-container/10">
              <blockquote className="font-serif italic text-lg text-on-surface-variant max-w-lg leading-relaxed relative">
                <span className="absolute -top-6 -left-4 text-5xl text-tertiary/20 font-serif">“</span>
                {currentQuote.text}
                <span className="absolute -bottom-10 -right-4 text-5xl text-tertiary/20 font-serif">”</span>
              </blockquote>
              <cite className="font-sans text-[11px] font-bold text-tertiary uppercase tracking-widest mt-6 block">
                — {currentQuote.author}
              </cite>
            </div>
          )}
        </div>

        {/* Right column: Shelf Statistics & Quick Actions (Much cleaner, no graphs) */}
        <div className="bg-surface-container-low/50 border border-outline-variant/15 rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
          <div className="space-y-4">
            <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10 pb-3 flex items-center gap-2">
              <FiTrendingUp className="text-primary w-4 h-4" />
              <span>Library Overview</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="bg-surface-container-high/20 p-4 rounded-xl border border-outline-variant/10 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Library Size</span>
                <p className="text-2xl font-serif font-bold text-on-surface">{books.length}</p>
                <span className="text-[9px] text-on-surface-variant/60 font-semibold block">Volumes imported</span>
              </div>
              <div className="bg-surface-container-high/20 p-4 rounded-xl border border-outline-variant/10 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">In Progress</span>
                <p className="text-2xl font-serif font-bold text-primary">
                  {books.filter(b => b.progress > 0 && b.progress < 100).length}
                </p>
                <span className="text-[9px] text-on-surface-variant/60 font-semibold block">Active readings</span>
              </div>
              <div className="bg-surface-container-high/20 p-4 rounded-xl border border-outline-variant/10 space-y-1.5 col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Completed Reading</span>
                  <span className="text-xs text-amber-500 font-bold flex items-center gap-1">
                    <FiZap className="w-3.5 h-3.5 fill-current" />
                    <span>{streakDays || 14}d Streak</span>
                  </span>
                </div>
                <p className="text-2xl font-serif font-bold text-tertiary">
                  {books.filter(b => b.progress === 100).length} books
                </p>
                <span className="text-[9px] text-on-surface-variant/60 font-semibold block">Read to completion</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-4">
            <button 
              onClick={() => navigate("/plans")}
              className="w-full bg-tertiary/10 text-tertiary border border-tertiary/20 hover:bg-tertiary/20 hover:border-tertiary transition-all duration-200 py-2.5 px-3 rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FiCalendar className="w-3.5 h-3.5" />
              <span>Configure Reading Plans</span>
            </button>
          </div>
        </div>

      </section>

      {/* 3. Reading Queue (To Read Next) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
          <h2 className="font-serif text-2xl font-bold text-on-surface">Reading Queue</h2>
          <span className="text-xs text-on-surface-variant/80 font-medium">Unopened volumes ready to explore</span>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-outline-variant/30 rounded-xl bg-surface-container/20 flex flex-col items-center justify-center gap-4">
            <FiBookOpen className="w-12 h-12 text-on-surface-variant/40" />
            <h3 className="font-serif text-xl font-bold text-on-surface">No books in catalog yet</h3>
            <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
              Import ebooks from local path to populate your catalog and view recommendations.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button 
                onClick={handleImport}
                className="bg-tertiary text-on-tertiary font-bold py-2.5 px-6 rounded-lg text-sm hover:bg-tertiary/90 transition shadow flex items-center gap-2 cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                <span>Import File</span>
              </button>
              <button 
                onClick={handleImportFolder}
                className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/35 text-on-surface font-bold py-2.5 px-6 rounded-lg text-sm transition shadow flex items-center gap-2 cursor-pointer"
              >
                <FiFolder className="w-4 h-4" />
                <span>Import Folder</span>
              </button>
            </div>
          </div>
        ) : books.filter(b => b.progress === 0).length === 0 ? (
          <div className="text-center py-12 border border-dashed border-outline-variant/20 rounded-2xl bg-surface-container/10 flex flex-col items-center justify-center gap-3">
            <FiBook className="w-10 h-10 text-on-surface-variant/30" />
            <h3 className="font-sans text-sm font-bold text-on-surface animate-fade-in">Your queue is empty</h3>
            <p className="text-xs text-on-surface-variant/85 max-w-xs leading-relaxed">
              Every book in your library is currently in progress or completed. Time to import something new!
            </p>
            <button 
              onClick={handleImport}
              className="mt-2 bg-tertiary/15 text-tertiary border border-tertiary/20 hover:bg-tertiary/25 hover:border-tertiary transition px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>Import Ebook</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.filter(b => b.progress === 0).slice(0, 10).map((book) => (
              <div 
                key={book.id}
                onClick={() => navigate(`/book-details/${book.id}`)}
                className="group cursor-pointer space-y-3 relative"
              >
                {/* Visual Cover Art Wrapper */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-300">
                  {covers[book.id] ? (
                    <img 
                      alt={book.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300" 
                      src={covers[book.id]} 
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center">
                      <FiBookOpen className="text-on-surface-variant/30 w-8 h-8" />
                    </div>
                  )}

                  {/* Visual indication tag of unopened book */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-tertiary uppercase tracking-wider">
                    New
                  </div>

                  {/* Resume hover Play Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book/${book.id}`);
                      }}
                      className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary shadow-md hover:scale-105 transition ml-auto flex items-center justify-center"
                      title="Start Reading"
                    >
                      <FiPlay className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-1">
                  <h3 className="font-serif text-sm font-bold text-on-surface truncate group-hover:text-tertiary transition-colors leading-tight">
                    {book.title}
                  </h3>
                  <p className="font-sans text-[11px] text-on-surface-variant/80 truncate">
                    {book.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Library Shelf */}
      {books.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
            <h2 className="font-serif text-2xl font-bold text-on-surface">Library Shelf</h2>
            <span className="text-xs text-on-surface-variant/80 font-medium">All books in your archive</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.slice(0, 10).map((book) => (
              <div 
                key={book.id}
                onClick={() => navigate(`/book-details/${book.id}`)}
                className="group cursor-pointer space-y-3 relative"
              >
                {/* Visual Cover Art Wrapper */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-300">
                  {covers[book.id] ? (
                    <img 
                      alt={book.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300" 
                      src={covers[book.id]} 
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center">
                      <FiBookOpen className="text-on-surface-variant/30 w-8 h-8" />
                    </div>
                  )}

                  {/* Progress tag overlay if in progress */}
                  {book.progress > 0 && book.progress < 100 && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-primary uppercase tracking-wider">
                      {book.progress}%
                    </div>
                  )}

                  {/* Completed tag overlay if completed */}
                  {book.progress === 100 && (
                    <div className="absolute top-2 left-2 bg-black/65 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-tertiary uppercase tracking-wider">
                      Completed
                    </div>
                  )}

                  {/* Resume hover Play Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book/${book.id}`);
                      }}
                      className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary shadow-md hover:scale-105 transition ml-auto flex items-center justify-center"
                      title="Read Book"
                    >
                      <FiPlay className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-1">
                  <h3 className="font-serif text-sm font-bold text-on-surface truncate group-hover:text-tertiary transition-colors leading-tight">
                    {book.title}
                  </h3>
                  <p className="font-sans text-[11px] text-on-surface-variant/80 truncate">
                    {book.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
