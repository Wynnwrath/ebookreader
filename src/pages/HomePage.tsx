import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { 
  FiPlay, 
  FiPlus, 
  FiClock, 
  FiAward, 
  FiZap,
  FiBookOpen,
  FiBook,
  FiChevronRight
} from "react-icons/fi";

interface OutletContextType {
  userId: number | null;
  importTrigger: number;
}

interface TauriBook {
  book_id: number;
  title: string;
  author?: string;
}

interface ProgressItem {
  book_id: number;
  progress_percentage: number;
  last_read_at: string | null;
}

interface Book {
  id: number;
  title: string;
  author: string;
  progress: number;
  lastReadAt: string | null;
  lastRead: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { userId, importTrigger } = useOutletContext<OutletContextType>();

  const [books, setBooks] = useState<Book[]>([]);
  const [covers, setCovers] = useState<Record<number, string>>({});
  const [streakDays, setStreakDays] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Rotating literary quotes
  const quotes = [
    { text: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
    { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
    { text: "I cannot live without books.", author: "Thomas Jefferson" },
    { text: "Books are a uniquely portable magic.", author: "Stephen King" },
    { text: "So many books, so little time.", author: "Frank Zappa" },
    { text: "Reading of all good books is like conversation with the finest minds.", author: "René Descartes" }
  ];
  const activeQuote = quotes[new Date().getDate() % quotes.length];

  const loadData = async () => {
    try {
      setLoading(true);
      const allBooks = await invoke<TauriBook[]>("list_books");
      const allProgress = await invoke<ProgressItem[]>("get_all_reading_progress", { userId });

      const progressMap: Record<number, ProgressItem> = {};
      allProgress.forEach((p) => {
        progressMap[p.book_id] = p;
      });

      // Format books list
      const booksWithProgress: Book[] = allBooks.map((b) => {
        const prog = progressMap[b.book_id];
        return {
          id: b.book_id,
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
          const coverBytes = await invoke<number[]>("get_cover_img", { bookId: book.book_id });
          if (coverBytes && coverBytes.length > 0) {
            const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
            newCovers[book.book_id] = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.error(`Failed to load cover for book ${book.book_id}:`, e);
        }
      }
      setCovers(newCovers);

    } catch (err) {
      console.error("Failed to load homepage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, importTrigger]);

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "EPUB Ebook", extensions: ["epub"] }]
      });
      if (selected) {
        await invoke("import_book", { path: selected });
        await loadData();
      }
    } catch (err) {
      console.error("Failed to import EPUB:", err);
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

  let displayReadingBooks = books.filter(b => b.progress > 0 && b.progress < 100);
  if (displayReadingBooks.length === 0) {
    if (books.length > 0) {
      displayReadingBooks = books.slice(0, 2).map((book, idx) => ({
        ...book,
        progress: idx === 0 ? 68 : 35,
        lastRead: idx === 0 ? "2h ago" : "Yesterday",
        lastReadAt: new Date(Date.now() - idx * 86400000).toISOString()
      }));
    } else {
      displayReadingBooks = [
        {
          id: -1,
          title: "Five Fall Into Adventure",
          author: "Enid Blyton",
          progress: 68,
          lastRead: "2h ago",
          lastReadAt: new Date().toISOString()
        },
        {
          id: -2,
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          progress: 35,
          lastRead: "Yesterday",
          lastReadAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    }
  }
  const unreadBooks = books.filter(b => b.progress === 0);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-on-surface-variant text-sm font-semibold">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-margin-desktop space-y-12 max-w-container-max mx-auto w-full page-transition pb-24">
            {/* 0. Header Greeting */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-on-surface tracking-tight">
            Welcome back, <span className="text-tertiary">Reader</span>
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1.5">
            Here's a look at your private archive and reading journey.
          </p>
        </div>
        
        {/* Compact Metrics & Date Badge */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/15 text-xs font-semibold text-amber-500 shadow-sm">
            <FiZap className="w-3.5 h-3.5 fill-current" />
            <span>{streakDays}d Streak</span>
          </div>

          {/* In Progress Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/15 text-xs font-semibold text-primary shadow-sm">
            <FiBookOpen className="w-3.5 h-3.5" />
            <span>{books.filter(b => b.progress > 0 && b.progress < 100).length} Progress</span>
          </div>

          {/* Library Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/15 text-xs font-semibold text-tertiary shadow-sm">
            <FiBook className="w-3.5 h-3.5" />
            <span>{books.length} Books</span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-outline-variant/30 hidden sm:block mx-1"></div>

          {/* Date Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/15 text-xs font-semibold text-on-surface-variant shadow-sm">
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </section>

      {/* 1. Quote / Inspiration Banner */}
      <section className="glass-panel rounded-xl p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <h2 className="font-label-sm text-xs text-tertiary uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <span className="text-tertiary font-serif text-base leading-none">“</span>
            Daily Inspiration
          </h2>
          <blockquote className="font-headline-lg text-2xl md:text-3xl text-on-surface mb-2 leading-tight italic">
            "{activeQuote.text}"
          </blockquote>
          <p className="font-body-md text-sm text-on-surface-variant">— {activeQuote.author}</p>
        </div>
      </section>

      {/* 2. Continue Reading (Shows mockups if no books in progress) */}
      {displayReadingBooks.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
            <h2 className="font-headline-md text-xl font-bold text-on-surface">Continue Reading</h2>
            <button 
              onClick={() => navigate("/library")}
              className="font-label-md text-xs text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-1 font-bold"
            >
              View All <FiChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
            {displayReadingBooks.map((book) => (
              <div 
                key={book.id}
                onClick={() => {
                  if (book.id < 0) {
                    if (books.length > 0) {
                      navigate(`/book-details/${books[0].id}`);
                    } else {
                      handleImport();
                    }
                  } else {
                    navigate(`/book-details/${book.id}`);
                  }
                }}
                className="snap-start shrink-0 w-[240px] group cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-sm border border-outline-variant/20 mb-4 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                  {covers[book.id] ? (
                    <img 
                      alt={book.title} 
                      className="w-full h-full object-cover" 
                      src={covers[book.id]} 
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center border-b border-outline-variant/10">
                      <FiBookOpen className="text-on-surface-variant/30 w-8 h-8" />
                    </div>
                  )}
                  
                  {/* Hover Play Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <button className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center text-black shadow-md hover:scale-105 transition-transform ml-auto">
                      <FiPlay className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-serif text-sm font-bold text-on-surface truncate mt-2 leading-snug">{book.title}</h3>
                <p className="font-sans text-[11px] text-on-surface-variant mb-2 truncate">{book.author}</p>
                
                {/* Progress Slider */}
                <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-outline-variant/15 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-tertiary rounded-full transition-all duration-300" 
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>
                  <span className="font-sans text-[10px] text-on-surface-variant/80 font-bold">{book.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Empty State or Recently Added */}
      {books.length === 0 ? (
        <section className="text-center py-16 border border-dashed border-outline-variant/30 rounded-xl bg-surface-container/20 flex flex-col items-center justify-center gap-4">
          <FiBookOpen className="w-12 h-12 text-on-surface-variant/40" />
          <h3 className="font-headline-md text-xl font-bold text-on-surface">Your library is currently empty</h3>
          <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
            Import your first EPUB ebook to begin cataloguing and immersive reading.
          </p>
          <button 
            onClick={handleImport}
            className="mt-2 bg-tertiary text-on-tertiary font-bold py-2.5 px-6 rounded-lg text-sm hover:bg-tertiary/90 transition shadow flex items-center gap-2 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Import EPUB</span>
          </button>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
            <h2 className="font-headline-md text-xl font-bold text-on-surface">Recently Added</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.map((book) => (
              <div 
                key={book.id}
                onClick={() => navigate(`/book-details/${book.id}`)}
                className="group cursor-pointer space-y-3"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
                  {covers[book.id] ? (
                    <img 
                      alt={book.title} 
                      className="w-full h-full object-cover" 
                      src={covers[book.id]} 
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center">
                      <FiBookOpen className="text-on-surface-variant/30 w-8 h-8" />
                    </div>
                  )}
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <button className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center text-black shadow-md hover:scale-105 transition-transform ml-auto">
                      <FiPlay className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-on-surface truncate group-hover:text-tertiary transition-colors leading-snug">{book.title}</h3>
                  <p className="font-sans text-[11px] text-on-surface-variant truncate">{book.author}</p>
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
