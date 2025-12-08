// src/components/BookComp/BookProgress.jsx

export default function BookProgress({
  currentPage = 0,
  totalPages = 0,
  className = "",
}) {
  const safeTotal = totalPages || 0;
  const progress =
    safeTotal > 0 ? Math.min(100, (currentPage / safeTotal) * 100) : 0;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="text-xs sm:text-sm text-gray-300">
        Page {currentPage} / {safeTotal || "?"}
      </div>
      <div className="w-full max-w-md h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-2 rounded-full bg-orange-400"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
