import React from "react";
import { FiBookOpen, FiCalendar, FiTrash2 } from "react-icons/fi";
import { ReadingPlan, Book } from "../../../types";

interface PlanCardProps {
  plan: ReadingPlan;
  covers: Record<number, string>;
  dbBooks: Book[];
  handleTogglePlan: (id: string) => void;
  handleDeletePlan: (id: string) => void;
  toggleDateCompletion: (planId: string, dateStr: string, targetPages: number) => void;
  getCurrentWeekDays: () => { dateStr: string; label: string }[];
  getPlanProgress: (plan: ReadingPlan) => number;
  onNavigateToBook: (bookId: number) => void;
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
        <circle
          className="text-outline-variant/15"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
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
      <span className="absolute text-[10px] font-sans font-bold text-on-surface">
        {progress}%
      </span>
    </div>
  );
};

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  covers,
  dbBooks,
  handleTogglePlan,
  handleDeletePlan,
  toggleDateCompletion,
  getCurrentWeekDays,
  getPlanProgress,
  onNavigateToBook,
}) => {
  const isLinked = plan.bookId !== null;
  const linkedBook = dbBooks.find((b) => b.id === plan.bookId);
  const currentProgress = getPlanProgress(plan);
  const weekDays = getCurrentWeekDays();
  const completedWeekDaysCount = plan.completedDates.filter((d) =>
    weekDays.some((w) => w.dateStr === d)
  ).length;

  return (
    <div className="bg-surface-container-low/30 border border-outline-variant/10 rounded-2xl p-6 hover:bg-surface-container-low/55 transition-all duration-300 shadow-sm flex flex-col gap-5 relative overflow-hidden animate-fade-in">
      <div className="flex gap-5 items-start justify-between">
        <div className="flex gap-4 items-start">
          {/* Book Cover (or default plan icon) */}
          {isLinked ? (
            <div 
              className="w-[70px] aspect-[2/3] rounded-lg overflow-hidden border border-outline-variant/20 shadow-md bg-surface-container shrink-0 cursor-pointer"
              onClick={() => onNavigateToBook(plan.bookId!)}
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
              return start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            })()}
          </span>
        </div>
      </div>

      {/* Weekly Check-in logs Calendar Row */}
      {plan.active && (
        <div className="space-y-2.5 pt-3 border-t border-outline-variant/10">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-on-surface-variant/80">
            <span>WEEKLY CHECK-IN LOG</span>
            <span>{completedWeekDaysCount} / 7 DAYS COMPLETED</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
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
};
