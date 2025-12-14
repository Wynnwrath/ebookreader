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
        /* UPDATED COLORS */
        bg-surface/95 backdrop-blur-xl
        border border-border rounded-xl
        shadow-lg
      ">
        <div className="flex flex-col">
          <span className="font-bold text-text text-xs leading-tight line-clamp-2">
            {title}
          </span>
          <span className="text-[10px] text-text-dim italic mt-0.5 truncate">
            {author || "Unknown Author"}
          </span>
        </div>

        <div className="w-full h-px bg-border my-0.5" />

        <div className="flex items-center justify-center gap-3">
          {pages > 0 && (
            <span className="text-[10px] text-text-dim font-mono">
              {pages}p
            </span>
          )}
          {rating > 0 && (
             <div className="flex items-center gap-0.5">
               {/* Matches the theme's primary accent */}
               <span className="text-[10px] text-primary font-bold">{rating}</span>
               <span className="text-[8px] text-primary/80">★</span>
             </div>
          )}
        </div>

        {/* The little arrow triangle at the bottom */}
        {/* Note: border-t-surface/95 ensures it blends with the tooltip body */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-surface/95" />
      </div>
    </div>
  );
}