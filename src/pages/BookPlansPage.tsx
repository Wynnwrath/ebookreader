import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { 
  FiCalendar, 
  FiClock, 
  FiBookOpen, 
  FiZap, 
  FiPlus, 
  FiTrash2, 
  FiAward,
  FiTrendingUp
} from "react-icons/fi";

interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  targetPagesPerDay: number;
  durationDays: number;
  active: boolean;
  startDate: string;
  bookId: number | null; // Associated book in database, if any
  progressPercentage?: number; // Override progress if no bookId
  completedDates: string[]; // List of completed dates (YYYY-MM-DD)
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
}

const CircularProgress: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({ 
  progress, 
  size = 48, 
  strokeWidth = 3.5 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track circle */}
        <circle
          className="text-outline-variant/15"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-tertiary transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center text */}
      <span className="absolute text-[10px] font-sans font-bold text-on-surface">
        {progress}%
      </span>
    </div>
  );
};

const BookPlansPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [dbBooks, setDbBooks] = useState<Book[]>([]);
  const [covers, setCovers] = useState<Record<number, string>>({});

  const [plans, setPlans] = useState<ReadingPlan[]>(() => {
    const saved = localStorage.getItem("stellaron_reading_plans");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Default initial plans
    const today = new Date();
    return [
      {
        id: "1",
        title: "Daily Philosophy Track",
        description: "Read 15 pages of deep philosophical works to build concentration.",
        targetPagesPerDay: 15,
        durationDays: 30,
        active: true,
        startDate: new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0],
        bookId: null,
        progressPercentage: 42,
        completedDates: [
          new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0],
          new Date(today.getTime() - 4 * 86400000).toISOString().split("T")[0],
          new Date(today.getTime() - 2 * 86400000).toISOString().split("T")[0],
          new Date(today.getTime() - 1 * 86400000).toISOString().split("T")[0],
        ]
      },
      {
        id: "2",
        title: "Scholarly Classics",
        description: "Engage with historic non-fiction and classic records.",
        targetPagesPerDay: 25,
        durationDays: 14,
        active: true,
        startDate: new Date(today.getTime() - 2 * 86400000).toISOString().split("T")[0],
        bookId: null,
        progressPercentage: 15,
        completedDates: [
          new Date(today.getTime() - 2 * 86400000).toISOString().split("T")[0],
          new Date(today.getTime() - 1 * 86400000).toISOString().split("T")[0],
        ]
      }
    ];
  });

  const [readingLog, setReadingLog] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("stellaron_reading_log");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Default mock data to populate the heatmap beautifully
    const log: Record<string, number> = {};
    const today = new Date();
    for (let i = 0; i < 40; i++) {
      if (Math.random() > 0.45) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        log[dateStr] = Math.floor(Math.random() * 35) + 10;
      }
    }
    return log;
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPages, setNewPages] = useState(20);
  const [newDuration, setNewDuration] = useState(14);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  const loadBooks = async () => {
    try {
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

      const formattedBooks: Book[] = allBooks.map((b) => {
        const prog = progressMap[b.id];
        return {
          id: b.id,
          title: b.title,
          author: b.author || "Unknown Author",
          progress: prog ? Math.round(prog.progress_percentage || 0) : 0,
        };
      });

      setDbBooks(formattedBooks);

      // Load covers
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
      console.error("Failed to load books for plans:", err);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    localStorage.setItem("stellaron_reading_plans", JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem("stellaron_reading_log", JSON.stringify(readingLog));
  }, [readingLog]);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPlan: ReadingPlan = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc || "No description provided.",
      targetPagesPerDay: newPages,
      durationDays: newDuration,
      active: true,
      startDate: new Date().toISOString().split("T")[0],
      bookId: selectedBookId,
      progressPercentage: selectedBookId === null ? 0 : undefined,
      completedDates: []
    };

    setPlans([newPlan, ...plans]);
    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
    setNewPages(20);
    setNewDuration(14);
    setSelectedBookId(null);
  };

  const handleTogglePlan = (id: string) => {
    setPlans(plans.map(p => {
      if (p.id === id) {
        return { ...p, active: !p.active };
      }
      return p;
    }));
  };

  const handleDeletePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  const getPlanProgress = (plan: ReadingPlan): number => {
    if (plan.bookId !== null) {
      const book = dbBooks.find(b => b.id === plan.bookId);
      return book ? book.progress : 0;
    }
    return plan.progressPercentage || 0;
  };

  const getCurrentWeekDays = (): { dateStr: string; label: string }[] => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const weekDays = [];
    const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayOffset + i);
      weekDays.push({
        dateStr: d.toISOString().split("T")[0],
        label: weekdayNames[i],
      });
    }
    return weekDays;
  };

  const toggleDateCompletion = (planId: string, dateStr: string, targetPages: number) => {
    setPlans(prevPlans => prevPlans.map(p => {
      if (p.id === planId) {
        const isCompleted = p.completedDates.includes(dateStr);
        let nextCompleted;
        if (isCompleted) {
          nextCompleted = p.completedDates.filter(d => d !== dateStr);
          // Subtract pages from global reading log
          setReadingLog(prevLog => {
            const currentVal = prevLog[dateStr] || 0;
            const newVal = Math.max(0, currentVal - targetPages);
            const nextLog = { ...prevLog };
            if (newVal === 0) {
              delete nextLog[dateStr];
            } else {
              nextLog[dateStr] = newVal;
            }
            return nextLog;
          });
        } else {
          nextCompleted = [...p.completedDates, dateStr];
          // Add pages to global reading log
          setReadingLog(prevLog => ({
            ...prevLog,
            [dateStr]: (prevLog[dateStr] || 0) + targetPages
          }));
        }
        return { ...p, completedDates: nextCompleted };
      }
      return p;
    }));
  };

  const getHeatmapDates = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    const startOffset = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const start = new Date(today);
    start.setDate(today.getDate() - startOffset - 11 * 7);
    
    for (let i = 0; i < 12 * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const calculateStreakFromLog = (log: Record<string, number>): number => {
    const dates = Object.keys(log).filter(d => log[d] > 0).sort().reverse();
    if (dates.length === 0) return 0;
    
    let streak = 0;
    const dateToYMD = (d: Date) => d.toISOString().split("T")[0];
    
    const todayStr = dateToYMD(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = dateToYMD(yesterday);
    
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      return 0;
    }
    
    const checkDate = new Date(dates[0]);
    while (true) {
      const checkStr = dateToYMD(checkDate);
      if (log[checkStr] > 0) {
        streak++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  };

  const streakDays = calculateStreakFromLog(readingLog);

  return (
    <div className="p-margin-desktop space-y-8 max-w-container-max mx-auto w-full page-transition pb-24 text-on-surface">
      
      {/* Header Panel (No page title/description to match native app feel) */}
      <section className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
        <div />
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition shadow-md py-2 px-4 rounded-xl font-sans text-xs font-bold cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Reading Plan</span>
        </button>
      </section>

      {/* Grid: Stats & Active Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Columns: Active/Inactive Plans */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
            <h2 className="text-xl font-serif font-bold text-on-surface">Active Schedules</h2>
            <span className="text-xs text-on-surface-variant/70 font-semibold">{plans.length} total plans</span>
          </div>

          <div className="space-y-6">
            {plans.map(plan => {
              const currentProgress = getPlanProgress(plan);
              const isLinked = plan.bookId !== null;
              const linkedBook = dbBooks.find(b => b.id === plan.bookId);

              return (
                <div 
                  key={plan.id}
                  className="bg-surface-container-low/30 border border-outline-variant/10 rounded-2xl p-6 hover:bg-surface-container-low/55 transition-all duration-300 shadow-sm flex flex-col gap-5 relative overflow-hidden"
                >
                  <div className="flex gap-5 items-start justify-between">
                    <div className="flex gap-4 items-start">
                      {/* Book Cover (or default plan icon) */}
                      {isLinked ? (
                        <div 
                          className="w-[70px] aspect-[2/3] rounded-lg overflow-hidden border border-outline-variant/20 shadow-md bg-surface-container shrink-0 cursor-pointer"
                          onClick={() => navigate(`/book-details/${plan.bookId}`)}
                        >
                          {covers[plan.bookId!] ? (
                            <img src={covers[plan.bookId!]} alt={linkedBook?.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiBookOpen className="text-on-surface-variant/30 w-5 h-5" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-[70px] aspect-[2/3] rounded-lg border border-dashed border-outline-variant/30 flex items-center justify-center bg-surface-container/20 shrink-0">
                          <FiCalendar className="w-6 h-6 text-on-surface-variant/40" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-serif font-bold text-on-surface leading-tight">
                            {plan.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                            plan.active 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                              : "bg-surface-container-high border-outline-variant/20 text-on-surface-variant/70"
                          }`}>
                            {plan.active ? "Active" : "Paused"}
                          </span>
                        </div>

                        {isLinked && linkedBook && (
                          <p className="text-xs text-tertiary font-sans font-semibold">
                            Target Book: {linkedBook.title}
                          </p>
                        )}
                        <p className="text-xs text-on-surface-variant/80 font-sans leading-relaxed max-w-lg">
                          {plan.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePlan(plan.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition border cursor-pointer ${
                          plan.active
                            ? "bg-surface-container/50 border-outline-variant/25 text-on-surface-variant hover:text-on-surface"
                            : "bg-tertiary/10 border-tertiary/20 text-tertiary hover:bg-tertiary/20"
                        }`}
                      >
                        {plan.active ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-on-surface-variant/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-400/20 cursor-pointer"
                        title="Delete Plan"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* SVG Donut Progress Indicator & Meta Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 px-4 rounded-xl bg-surface-container-low/20 border border-outline-variant/5 text-xs font-semibold text-on-surface-variant/85">
                    <div className="flex items-center gap-3">
                      <CircularProgress progress={currentProgress} size={42} strokeWidth={3} />
                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase block">Progress</span>
                        <span className="text-xs text-on-surface font-bold">{currentProgress}% read</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase block">Daily Goal</span>
                      <span className="text-xs text-on-surface font-bold">{plan.targetPagesPerDay} pgs</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase block">Est. Time</span>
                      <span className="text-xs text-on-surface font-bold">{Math.round(plan.targetPagesPerDay * 1.5)} mins</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase block">End Date</span>
                      <span className="text-xs text-on-surface font-bold">
                        {(() => {
                          const start = new Date(plan.startDate);
                          start.setDate(start.getDate() + plan.durationDays);
                          return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Weekly Check-in logs Calendar Row */}
                  {plan.active && (
                    <div className="space-y-2.5 pt-3 border-t border-outline-variant/10">
                      <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-on-surface-variant/80">
                        <span>WEEKLY CHECK-IN LOG</span>
                        <span>{plan.completedDates.filter(d => getCurrentWeekDays().some(w => w.dateStr === d)).length} / 7 DAYS COMPLETED</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {getCurrentWeekDays().map((day, idx) => {
                          const isDone = plan.completedDates.includes(day.dateStr);
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleDateCompletion(plan.id, day.dateStr, plan.targetPagesPerDay)}
                              className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer select-none ${
                                isDone
                                  ? "bg-tertiary/10 border-tertiary/30 text-tertiary"
                                  : "bg-surface-container/30 border-outline-variant/10 text-on-surface-variant/60 hover:border-outline-variant/20 hover:text-on-surface-variant"
                              }`}
                            >
                              <span className="text-[9px] font-bold tracking-wider uppercase">{day.label}</span>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                                isDone ? "bg-tertiary text-on-tertiary" : "bg-surface-container border border-outline-variant/10"
                              }`}>
                                {isDone ? "✓" : ""}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar Column: Heatmap & Streaks */}
        <div className="space-y-8">
          {/* GitHub-style Reading Heatmap Grid */}
          <div className="bg-surface-container-low/40 border border-outline-variant/15 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10 pb-3 flex items-center gap-2">
              <FiCalendar className="text-tertiary w-4 h-4" />
              <span>Reading Heatmap</span>
            </h3>
            
            <p className="text-[11px] text-on-surface-variant/80 font-sans leading-relaxed">
              Visual log of your daily page count history over the past 12 weeks.
            </p>

            <div className="flex gap-2.5 pt-2 select-none overflow-x-auto pb-1 justify-center">
              {/* Heatmap Grid */}
              <div className="flex gap-1">
                {(() => {
                  const heatmapDates = getHeatmapDates();
                  const columns = [];
                  for (let i = 0; i < 12; i++) {
                    columns.push(heatmapDates.slice(i * 7, (i + 1) * 7));
                  }
                  return columns.map((col, cIdx) => (
                    <div key={cIdx} className="flex flex-col gap-1 flex-shrink-0">
                      {col.map((date, dIdx) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const pages = readingLog[dateStr] || 0;
                        let colorClass = "bg-outline-variant/10 hover:border-outline-variant/40";
                        if (pages > 0 && pages <= 15) colorClass = "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/5";
                        else if (pages > 15 && pages <= 30) colorClass = "bg-emerald-500/40 hover:bg-emerald-500/50 border-emerald-500/10";
                        else if (pages > 30 && pages <= 45) colorClass = "bg-emerald-500/70 hover:bg-emerald-500/80 border-emerald-500/20";
                        else if (pages > 45) colorClass = "bg-emerald-500 hover:bg-emerald-500/90 text-on-primary";

                        return (
                          <div
                            key={dIdx}
                            className={`w-3.5 h-3.5 rounded-[3px] border border-transparent transition-colors duration-150 ${colorClass}`}
                            title={`${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${pages} pages read`}
                          />
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            {/* Heatmap Legend */}
            <div className="flex items-center justify-between text-[9px] font-bold text-on-surface-variant/65 pt-2 uppercase">
              <span>Less</span>
              <div className="flex gap-1 items-center">
                <div className="w-2.5 h-2.5 rounded bg-outline-variant/10" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500/20" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500/40" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500/70" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Reading Streak Card */}
          <div className="bg-surface-container-low/40 border border-outline-variant/15 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/25">
                <FiZap className="w-5 h-5 text-amber-500 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface font-sans">Streak Tracker</h3>
                <p className="text-[11px] text-on-surface-variant/80 font-medium">Keep check-ins constant.</p>
              </div>
            </div>

            <div className="text-center py-2 flex items-baseline justify-center gap-1.5">
              <span className="text-4xl font-extrabold text-amber-500 font-serif">{streakDays}</span>
              <span className="text-[10px] font-bold text-on-surface-variant/85 uppercase tracking-widest">Days Streak</span>
            </div>
          </div>

          {/* Achievements list */}
          <div className="bg-surface-container-low/40 border border-outline-variant/15 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10 pb-3 flex items-center gap-2">
              <FiAward className="w-4 h-4 text-tertiary" />
              <span>Milestones Unlocked</span>
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary text-[10px] shrink-0 font-extrabold shadow-sm">I</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">First Ebook Imported</p>
                  <p className="text-[10px] text-on-surface-variant/75 truncate">Expanded the private digital archive</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] shrink-0 font-extrabold shadow-sm">II</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">10 Days Streak Achieved</p>
                  <p className="text-[10px] text-on-surface-variant/75 truncate">Established persistent reading habits</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-surface-container-high border border-outline-variant/15 flex items-center justify-center text-on-surface-variant/55 text-[10px] shrink-0 font-extrabold shadow-sm">III</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface-variant truncate">Scholarly Mastermind</p>
                  <p className="text-[10px] text-on-surface-variant/65 truncate">Read 5 hours total within one week</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Plan Builder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-backdrop">
          <div className="bg-surface border border-outline-variant/25 rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden relative p-8 flex flex-col gap-6 animate-zoom-in-modal text-on-surface">
            
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
              <h2 className="text-2xl font-serif font-bold text-on-surface">Create Reading Plan</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high p-1 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Plan Title</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Classical Philosophy Track" 
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                <textarea 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Summarize your goals..." 
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition h-20 resize-none"
                />
              </div>

              {/* Book Association Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Associate with Book</label>
                <select 
                  value={selectedBookId === null ? "" : selectedBookId}
                  onChange={e => setSelectedBookId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition cursor-pointer"
                >
                  <option value="">-- No Book Associated (Manual Progress) --</option>
                  {dbBooks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.author})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pages / Day</label>
                  <input 
                    type="number" 
                    value={newPages} 
                    onChange={e => setNewPages(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Duration (Days)</label>
                  <input 
                    type="number" 
                    value={newDuration} 
                    onChange={e => setNewDuration(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition shadow-sm font-bold text-xs cursor-pointer"
                >
                  Create Plan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default BookPlansPage;
