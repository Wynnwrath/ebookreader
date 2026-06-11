import { useState, useEffect } from "react";
import { ReadingPlan, Book, ReadingProgress } from "../../../types";
import { tauriService } from "../../../services/tauriService";

export const useReadingPlans = () => {
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

  const loadBooks = async () => {
    try {
      const allBooks = await tauriService.listBooks();
      const progressPromises = allBooks.map(async (b) => {
        try {
          const p = await tauriService.getReadingProgress({ bookId: b.id });
          return p;
        } catch {
          return null;
        }
      });
      const progressResults = await Promise.all(progressPromises);
      const allProgress = progressResults.filter((p): p is ReadingProgress => p !== null);

      const progressMap: Record<number, ReadingProgress> = {};
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

  const handleCreatePlan = (
    title: string,
    desc: string,
    pages: number,
    duration: number,
    bookId: number | null
  ) => {
    const newPlan: ReadingPlan = {
      id: Date.now().toString(),
      title,
      description: desc || "No description provided.",
      targetPagesPerDay: pages,
      durationDays: duration,
      active: true,
      startDate: new Date().toISOString().split("T")[0],
      bookId,
      progressPercentage: bookId === null ? 0 : undefined,
      completedDates: []
    };

    setPlans([newPlan, ...plans]);
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

  return {
    plans,
    dbBooks,
    covers,
    readingLog,
    streakDays,
    handleCreatePlan,
    handleTogglePlan,
    handleDeletePlan,
    getPlanProgress,
    getCurrentWeekDays,
    toggleDateCompletion,
    getHeatmapDates
  };
};
