// src/components/Reader/ReaderFooter.jsx

export default function ReaderFooter({ currentPage, totalPages }) {
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex flex-col items-center gap-2">
      <div className="text-xs sm:text-sm text-gray-300">
        Page {currentPage} / {totalPages}
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
