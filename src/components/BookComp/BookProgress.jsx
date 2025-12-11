import React from "react";

export default function BookProgress({ 
  progress,       
  currentPage,    
  totalPages,     
  className = "" 
}) {
  let calculatedProgress = 0;

  if (typeof progress === "number") {
    calculatedProgress = progress;
  } else if (currentPage && totalPages && totalPages > 0) {
    calculatedProgress = (currentPage / totalPages) * 100;
  }

  const safeProgress = Math.min(100, Math.max(0, calculatedProgress));

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="flex justify-between w-full text-xs text-gray-400 px-1 font-mono">
        <span>Progress</span>
        {/* 'tabular-nums' ensures numbers are same width. 'w-[3rem]' reserves fixed space. */}
        <span className="tabular-nums text-right w-[3rem]">
          {safeProgress.toFixed(0)}%
        </span>
      </div>
      
      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-300 ease-out"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
}