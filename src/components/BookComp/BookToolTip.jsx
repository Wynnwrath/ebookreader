export default function BookTooltip({ title, author, pages, rating }) {
  return (
    <div className="
      absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48
      z-50 pointer-events-none
      opacity-0 group-hover:opacity-100 
      transition-all duration-300 ease-out transform group-hover:-translate-y-1
    ">
      <div className="
        relative flex flex-col gap-1.5 p-3 text-center
        bg-[#1a1625]/95 backdrop-blur-xl
        border border-white/10 rounded-xl
        shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]
      ">
        <div className="flex flex-col">
          <span className="font-bold text-white text-xs leading-tight line-clamp-2">
            {title}
          </span>
          <span className="text-[10px] text-gray-400 italic mt-0.5 truncate">
            {author || "Unknown Author"}
          </span>
        </div>

        <div className="w-full h-px bg-white/5 my-0.5" />

        <div className="flex items-center justify-center gap-3">
          {pages > 0 && (
            <span className="text-[10px] text-gray-500 font-mono">
              {pages}p
            </span>
          )}
          {rating > 0 && (
             <div className="flex items-center gap-0.5">
               <span className="text-[10px] text-yellow-500 font-bold">{rating}</span>
               <span className="text-[8px] text-yellow-500/80">★</span>
             </div>
          )}
        </div>

        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#1a1625]/95" />
      </div>
    </div>
  );
}