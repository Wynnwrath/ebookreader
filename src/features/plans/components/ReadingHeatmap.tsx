import React from "react";
import { FiCalendar } from "react-icons/fi";

interface ReadingHeatmapProps {
  readingLog: Record<string, number>;
}

export const ReadingHeatmap: React.FC<ReadingHeatmapProps> = ({ readingLog }) => {
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

  const heatmapDates = getHeatmapDates();
  const columns: Date[][] = [];
  for (let i = 0; i < 12; i++) {
    columns.push(heatmapDates.slice(i * 7, (i + 1) * 7));
  }

  return (
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
          {columns.map((col, cIdx) => (
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
          ))}
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
  );
};
