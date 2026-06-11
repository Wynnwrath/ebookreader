import React from "react";
import { FiTrendingUp, FiZap, FiCalendar } from "react-icons/fi";

interface LibraryOverviewProps {
  booksCount: number;
  inProgressCount: number;
  completedCount: number;
  streakDays: number;
  onConfigurePlans: () => void;
}

const LibraryOverview: React.FC<LibraryOverviewProps> = ({
  booksCount,
  inProgressCount,
  completedCount,
  streakDays,
  onConfigurePlans,
}) => {
  return (
    <div className="bg-surface-container-low/50 border border-outline-variant/15 rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
      <div className="space-y-4">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10 pb-3 flex items-center gap-2">
          <FiTrendingUp className="text-primary w-4 h-4" />
          <span>Library Overview</span>
        </h2>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="bg-surface-container-high/20 p-4 rounded-xl border border-outline-variant/10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Library Size</span>
            <p className="text-2xl font-serif font-bold text-on-surface">{booksCount}</p>
            <span className="text-[9px] text-on-surface-variant/60 font-semibold block">Volumes imported</span>
          </div>
          <div className="bg-surface-container-high/20 p-4 rounded-xl border border-outline-variant/10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">In Progress</span>
            <p className="text-2xl font-serif font-bold text-primary">
              {inProgressCount}
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
              {completedCount} books
            </p>
            <span className="text-[9px] text-on-surface-variant/60 font-semibold block">Read to completion</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pt-4">
        <button 
          onClick={onConfigurePlans}
          className="w-full bg-tertiary/10 text-tertiary border border-tertiary/20 hover:bg-tertiary/20 hover:border-tertiary transition-all duration-200 py-2.5 px-3 rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <FiCalendar className="w-3.5 h-3.5" />
          <span>Configure Reading Plans</span>
        </button>
      </div>
    </div>
  );
};

export default LibraryOverview;
