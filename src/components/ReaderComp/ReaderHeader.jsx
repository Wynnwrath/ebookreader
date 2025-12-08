// src/components/Reader/ReaderHeader.jsx

export default function ReaderHeader({ bookId, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-black/20 border-b border-white/10">
      <div className="flex flex-col">
        <span className="text-sm text-gray-300">Reading</span>
        <span className="text-base sm:text-lg font-semibold text-white truncate">
          {bookId || "Current book"}
        </span>
      </div>

      <button
        onClick={onClose}
        className="
          px-3 py-1.5 rounded-full 
          bg-white/10 hover:bg-white/20 
          text-xs sm:text-sm text-gray-200
          border border-white/20
        "
      >
        Close
      </button>
    </div>
  );
}
