import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
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

interface OutletContextType {
  userId: number | null;
  importTrigger: number;
}

interface TauriBook {
  id: number;
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

  // Weekly Reading Minutes (mock data for the chart)
  const weeklyReadingData = [
    { day: "Mon", minutes: 25 },
    { day: "Tue", minutes: 40 },
    { day: "Wed", minutes: 15 },
    { day: "Thu", minutes: 30 },
    { day: "Fri", minutes: 50 },
    { day: "Sat", minutes: 65 },
    { day: "Sun", minutes: 45 }
  ];
  const maxMinutes = Math.max(...weeklyReadingData.map(d => d.minutes));

  const loadData = async () => {
    try {
      setLoading(true);
      const allBooks = await invoke<TauriBook[]>("list_books");
      
      const progressPromises = allBooks.map(async (b) => {
        try {
          const p = await invoke<ProgressItem | null>("get_reading_progress", { bookId: b.id });
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
          const coverBytes = await invoke<number[]>("get_cover_img", { bookId: book.id });
          if (coverBytes && coverBytes.length > 0) {
            const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
            newCovers[book.id] = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.error(`Failed to load cover for book ${book.id}:`, e);
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
        filters: [{ name: "Ebook / Document", extensions: ["epub", "pdf"] }]
      });
      if (selected && typeof selected === "string") {
        await invoke("import_book", { path: selected });
        await loadData();
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
        const errors = await invoke<string[]>("scan_books_directory", { directoryPath: selected });
        await loadData();
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

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-on-surface-variant text-sm font-semibold">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-margin-desktop space-y-12 max-w-container-max mx-auto w-full page-transition pb-24 text-on-surface">
      
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/15 text-xs font-semibold text-amber-500 shadow-sm animate-pulse-subtle">
            <FiZap className="w-3.5 h-3.5 fill-current" />
            <span>{streakDays || 14}d Streak</span>
          </div>

          {/* In Progress Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/15 text-xs font-semibold text-primary shadow-sm">
            <FiBookOpen className="w-3.5 h-3.5" />
            <span>{books.filter(b => b.progress > 0 && b.progress < 100).length || 2} Active</span>
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

      {/* 1. Continue Reading / My books (Matching the reference layout precisely) */}
      {displayReadingBooks.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
            <h2 className="font-sans text-2xl font-bold text-on-surface">My books</h2>
            <button 
              onClick={() => navigate("/library")}
              className="font-label-md text-xs text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-1 font-bold cursor-pointer"
            >
              View All <FiChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Grid of clean horizontal book entries */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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
                className="group flex gap-5 cursor-pointer items-start"
              >
                {/* Cover art on the left */}
                <div className="w-[140px] sm:w-[150px] aspect-[2/3] rounded-xl overflow-hidden border border-outline-variant/20 shadow-md shrink-0 bg-surface-container">
                  {covers[book.id] ? (
                    <img 
                      alt={book.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300" 
                      src={covers[book.id]} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiBookOpen className="text-on-surface-variant/30 w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Details on the right */}
                <div className="flex-1 flex flex-col justify-between self-stretch py-2 min-w-0">
                  <div className="space-y-1">
                    <h3 className="font-sans text-xl font-extrabold text-on-surface leading-tight group-hover:text-tertiary transition-colors line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="font-sans text-sm text-on-surface-variant/80 font-normal mt-1">
                      {book.author}
                    </p>
                  </div>

                  <div className="space-y-4 mt-auto">
                    {/* Progress details & solid indicator line */}
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-on-surface rounded-full transition-all duration-300" 
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-on-surface-variant font-bold">
                        <span>{book.progress}% completed</span>
                        {book.lastRead && <span>{book.lastRead}</span>}
                      </div>
                    </div>

                    {/* Large yellow play button below the progress bar */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book/${book.id < 0 ? 1 : book.id}`);
                      }}
                      className="w-14 h-14 rounded-full bg-[#fdbf15] hover:bg-[#fdbf15]/90 text-black flex items-center justify-center shadow-md hover:scale-105 transition duration-200 active:scale-95 cursor-pointer"
                      title="Resume Reading"
                    >
                      <FiPlay className="w-5 h-5 fill-current ml-0.5 text-black" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Reading Analytics & Book Plans Widgets */}
      <section className="space-y-6">
        <div className="border-b border-outline-variant/10 pb-3">
          <h2 className="font-headline-md text-xl font-bold text-on-surface">Reading Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SVG Weekly Activity Graph Widget */}
          <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant/15 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <FiActivity className="text-tertiary w-4.5 h-4.5" />
                <span>Weekly Reading Minutes</span>
              </h3>
              <span className="text-[11px] text-on-surface-variant font-bold bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/10">
                Avg: 38m / day
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="w-full h-44 flex items-end justify-between px-2 pt-4 relative">
              {/* Backgrid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
                <div className="border-b border-outline-variant/5 w-full h-[1px]"></div>
                <div className="border-b border-outline-variant/5 w-full h-[1px]"></div>
                <div className="border-b border-outline-variant/5 w-full h-[1px]"></div>
              </div>

              {weeklyReadingData.map((data, idx) => {
                const heightPercentage = (data.minutes / maxMinutes) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1 group z-10">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-36 bg-surface-container-highest text-[10px] text-on-surface font-bold px-2 py-0.5 rounded border border-outline-variant/20 shadow transition-opacity duration-200">
                      {data.minutes}m
                    </div>
                    {/* The Bar */}
                    <div className="w-8 sm:w-12 bg-surface-container-highest rounded-t-md relative overflow-hidden h-28 flex items-end">
                      <div 
                        className="w-full bg-gradient-to-t from-tertiary/70 to-tertiary rounded-t-md transition-all duration-500" 
                        style={{ height: `${heightPercentage}%` }}
                      />
                    </div>
                    {/* Day label */}
                    <span className="text-[10px] font-bold text-on-surface-variant">{data.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Column */}
          <div className="bg-surface-container-low border border-outline-variant/15 rounded-xl p-6 space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-2.5">
              <FiTrendingUp className="text-primary w-4.5 h-4.5" />
              <span>Statistics Summary</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 flex-1 py-1">
              <div className="bg-surface-container-high/40 p-3 rounded-lg border border-outline-variant/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">Monthly Time</span>
                <p className="text-lg font-serif font-bold text-on-surface">18.4 hrs</p>
              </div>
              <div className="bg-surface-container-high/40 p-3 rounded-lg border border-outline-variant/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">Pages Read</span>
                <p className="text-lg font-serif font-bold text-on-surface">1,420 pgs</p>
              </div>
              <div className="bg-surface-container-high/40 p-3 rounded-lg border border-outline-variant/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">Finished Books</span>
                <p className="text-lg font-serif font-bold text-on-surface">4 books</p>
              </div>
              <div className="bg-surface-container-high/40 p-3 rounded-lg border border-outline-variant/10 space-y-1 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">Active Streak</span>
                <p className="text-lg font-serif font-bold text-amber-500 flex items-center gap-1.5">
                  <FiZap className="w-4 h-4 fill-current" />
                  <span>14 days</span>
                </p>
              </div>
            </div>

            <button 
              onClick={() => navigate("/plans")}
              className="w-full mt-2 bg-tertiary/15 text-tertiary border border-tertiary/20 hover:bg-tertiary/25 hover:border-tertiary transition py-2 px-3 rounded-lg font-label-md text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FiCalendar className="w-3.5 h-3.5" />
              <span>View Reading Plans</span>
            </button>
          </div>

        </div>
      </section>

      {/* 3. Discover Recommendations Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
          <h2 className="font-headline-md text-xl font-bold text-on-surface">Discover Recommendations</h2>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-outline-variant/30 rounded-xl bg-surface-container/20 flex flex-col items-center justify-center gap-4">
            <FiBookOpen className="w-12 h-12 text-on-surface-variant/40" />
            <h3 className="font-headline-md text-xl font-bold text-on-surface">No books in catalog yet</h3>
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
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.slice(0, 5).map((book) => (
              <div 
                key={book.id}
                onClick={() => navigate(`/book-details/${book.id}`)}
                className="group cursor-pointer space-y-3 relative"
              >
                {/* Visual Cover Art Wrapper */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shadow-sm hover:shadow-md transition duration-300">
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

                  {/* Rating Stars Overlay tag */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-400 flex items-center gap-1">
                    <FiStar className="w-2.5 h-2.5 fill-current" />
                    <span>4.8</span>
                  </div>

                  {/* Bookmark tag overlay */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition cursor-pointer"
                  >
                    <FiBookmark className="w-3.5 h-3.5" />
                  </button>

                  {/* Resume hover Play Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book/${book.id}`);
                      }}
                      className="w-8 h-8 rounded-full bg-amber-400 text-black shadow-md hover:scale-105 transition ml-auto flex items-center justify-center"
                    >
                      <FiPlay className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Metadatas */}
                <div className="space-y-1">
                  <h3 className="font-serif text-sm font-bold text-on-surface truncate group-hover:text-tertiary transition-colors leading-tight">
                    {book.title}
                  </h3>
                  <p className="font-sans text-[11px] text-on-surface-variant truncate">
                    {book.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default HomePage;
