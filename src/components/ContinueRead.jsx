import Library from "./Bookdata/Library";

export default function ContinueRead() {
  return (
    <div className="[grid-area:continue] w-full h-full flex flex-col p-2 overflow-hidden">
      
      {/* Header Section */}
      <div className="flex items-center gap-3 px-2 mb-3 mt-2 shrink-0">
        <div className="w-1 h-6 bg-primary rounded-full shadow-glow" />
        <h2 className="text-lg sm:text-xl font-bold text-text tracking-wide">
          BOOKS
        </h2>
      </div>

      {/* Library Container */}
      <div className="
        flex-1 w-full min-h-0 relative rounded-xl 
        border border-border 
        bg-glass
      ">
        <Library />
      </div>
    </div>
  );
}