import Library from "./Bookdata/Library";

export default function ContinueRead() {
  return (
    // [grid-area:continue] places it at the bottom.
    // overflow-hidden keeps the library list contained.
    <div className="[grid-area:continue] w-full h-full flex flex-col p-2 overflow-hidden">
      
      {/* Header Section (Matches screenshot design) */}
      <div className="flex items-center gap-3 px-2 mb-3 mt-2 shrink-0">
        <div className="w-1 h-6 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
        <h2 className="text-lg sm:text-xl font-semibold text-white tracking-wide">
          Continue Reading
        </h2>
      </div>

      {/* Library Container - Takes remaining space */}
      <div className="flex-1 w-full min-h-0 relative rounded-xl border border-white/5 bg-white/[0.02]">
        <Library />
      </div>
    </div>
  );
}