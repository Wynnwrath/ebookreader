// src/components/BookComp/BookProgress.jsx
export default function BookProgress({ progress = 0, className = "" }) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="text-xs sm:text-sm text-gray-300">
        {safeProgress.toFixed(0)}%
      </div>
      <div className="w-full max-w-md h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-2 rounded-full bg-orange-400 transition-all duration-100"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
}
