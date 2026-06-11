import React from "react";
import { FiPlay, FiTrash2, FiHeart, FiBookOpen, FiCheckCircle } from "react-icons/fi";
import Card from "./Card";
import Button from "./Button";

export interface Book {
  id: number;
  title: string;
  author: string;
  favorite?: boolean;
  progress: number;
  lastRead?: string;
  lastReadAt?: string | null;
}

export interface BookCardProps {
  book: Book;
  cover?: string;
  variant?: "grid" | "list" | "spotlight" | "mini";
  animate?: boolean;
  stagger?: number;
  favorite?: boolean;
  onToggleFavorite?: (id: number, event: React.MouseEvent) => void;
  onDelete?: (id: number, title: string, event: React.MouseEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
}

export const getCoverColorClass = (id: number): string => {
  const colors = [
    "bg-slate-800 border-slate-700 text-slate-200",
    "bg-zinc-800 border-zinc-700 text-zinc-200",
    "bg-neutral-800 border-neutral-700 text-neutral-200",
    "bg-indigo-950 border-indigo-900 text-indigo-300",
    "bg-amber-950 border-amber-900 text-amber-300",
    "bg-teal-950 border-teal-900 text-teal-300",
  ];
  return colors[id % colors.length];
};

const BookCard: React.FC<BookCardProps> = ({
  book,
  cover,
  variant = "grid",
  animate = true,
  stagger = 1,
  favorite = false,
  onToggleFavorite,
  onDelete,
  onClick,
}) => {
  if (!book) return null;

  const isCompleted = book.progress === 100;
  const isUnread = book.progress === 0;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  if (variant === "spotlight") {
    let sectionTitle = "Spotlight Read";
    let buttonLabel = "Resume Journey";
    
    if (isCompleted) {
      sectionTitle = "Finished Reading";
      buttonLabel = "Replay Journey";
    } else if (isUnread) {
      sectionTitle = "Next Adventure";
      buttonLabel = "Begin Journey";
    }

    return (
      <Card
        variant="spotlight"
        animate={animate}
        stagger={stagger}
        onClick={handleClick}
        className="hover:shadow-lg transition duration-300 flex flex-col sm:flex-row gap-6"
      >
        {/* Visual backdrop blur / glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Book cover with premium shadow */}
        <div className="w-28 h-40 rounded-xl overflow-hidden shrink-0 border border-border/70 shadow-lg bg-bg relative group transition-transform duration-300 hover:scale-102">
          {cover ? (
            <img 
              src={cover} 
              alt={book.title}
              className="w-full h-full object-cover cover-image"
            />
          ) : (
            <div className={`w-full h-full flex flex-col justify-between p-3 font-serif ${getCoverColorClass(book.id)}`}>
              <div className="text-[9px] uppercase tracking-widest opacity-85">Ebook</div>
              <div className="font-bold text-xs leading-tight line-clamp-3">{book.title}</div>
              <div className="text-[8px] opacity-70 italic truncate">{book.author}</div>
            </div>
          )}
        </div>

        {/* Details info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                {sectionTitle}
              </span>
              <span className="text-[10px] text-text-dim">
                {isUnread ? "Imported recently" : `Last read ${book.lastRead}`}
              </span>
            </div>
            
            <h3 className="text-xl font-extrabold tracking-tight text-text leading-tight truncate" title={book.title}>
              {book.title}
            </h3>
            <p className="text-xs text-text-dim font-medium">By {book.author}</p>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-dim font-semibold">Progression</span>
              <span className="font-bold text-primary">{book.progress}% Completed</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-bg border border-border/30 overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${book.progress}%` }}
              />
            </div>
            
            <Button
              variant="primary"
              size="sm"
              icon={FiPlay}
              onClick={handleClick}
            >
              {buttonLabel}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "list") {
    return (
      <Card
        variant="default"
        animate={animate}
        stagger={stagger}
        hoverEffect={true}
        onClick={handleClick}
        className="flex items-center gap-4 group"
      >
        {/* Tiny Cover */}
        <div className="w-10 h-14 rounded overflow-hidden shrink-0 border border-border bg-bg relative">
          {cover ? (
            <img 
              src={cover} 
              alt={book.title}
              className="w-full h-full object-cover cover-image"
            />
          ) : (
            <div className={`w-full h-full flex flex-col justify-between p-1.5 font-serif text-[7px] text-white leading-tight ${getCoverColorClass(book.id)}`}>
              <div className="font-bold line-clamp-1">{book.title}</div>
              <div className="opacity-75 truncate">{book.author}</div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6">
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-text truncate group-hover:text-primary transition" title={book.title}>
              {book.title}
            </h3>
            <p className="text-xs text-text-dim truncate">By {book.author}</p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex flex-col items-end gap-1 w-24 sm:w-32">
              <div className="flex justify-between w-full text-[10px] text-text-dim font-medium">
                <span>
                  {isCompleted ? (
                    <span className="text-tertiary font-bold">Finished</span>
                  ) : (
                    <span>Reading</span>
                  )}
                </span>
                <span>{book.progress}%</span>
              </div>
              <div className="w-full h-1 rounded-full bg-bg overflow-hidden border border-border/50">
                <div 
                  className={`h-full ${isCompleted ? "bg-tertiary" : "bg-primary"} transition-all duration-300`} 
                  style={{ width: `${book.progress}%` }} 
                />
              </div>
            </div>

            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(book.id, e);
                }}
                className="p-1.5 rounded hover:bg-glass text-text cursor-pointer"
              >
                <FiHeart className={`w-3.5 h-3.5 ${favorite ? "fill-secondary text-secondary" : "text-text-dim"}`} />
              </button>
            )}

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(book.id, book.title, e);
                }}
                title="Delete book"
                className="p-1.5 rounded-md bg-transparent border border-transparent text-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer hover:bg-red-500/10 hover:border-red-500/25"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "mini") {
    return (
      <Card
        variant="default"
        animate={animate}
        stagger={stagger}
        hoverEffect={true}
        onClick={handleClick}
        className="flex items-center gap-4 group"
      >
        <div className="w-12 h-16 rounded-md overflow-hidden shrink-0 border border-border bg-bg relative">
          {cover ? (
            <img 
              src={cover} 
              alt={book.title}
              className="w-full h-full object-cover cover-image"
            />
          ) : (
            <div className={`w-full h-full flex flex-col justify-between p-1.5 font-serif text-[7px] leading-tight ${getCoverColorClass(book.id)}`}>
              <div className="font-bold line-clamp-2">{book.title}</div>
              <div className="opacity-70 truncate">{book.author}</div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="font-bold text-xs text-text truncate group-hover:text-primary transition">{book.title}</h4>
          <p className="text-[10px] text-text-dim truncate">By {book.author}</p>
          {isCompleted ? (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-tertiary bg-tertiary/10 border border-tertiary/20 px-1.5 py-0.2 rounded-md">Completed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-1 rounded-full bg-bg overflow-hidden border border-border/40">
                <div className="h-full bg-primary" style={{ width: `${book.progress}%` }} />
              </div>
              <span className="text-[9px] text-text-dim font-bold">{book.progress}%</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Default "grid" variant
  return (
    <Card
      variant="default"
      animate={animate}
      stagger={stagger}
      hoverEffect={true}
      onClick={handleClick}
      className="flex flex-col p-3 relative group"
    >
      {/* Cover layout */}
      <div className="w-full aspect-[2/3] rounded-lg overflow-hidden shrink-0 border border-border shadow-sm bg-bg relative transition duration-200">
        {cover ? (
          <img 
            src={cover} 
            alt={book.title}
            className="w-full h-full object-cover cover-image"
          />
        ) : (
          <div className={`w-full h-full flex flex-col justify-between p-4 font-serif text-white ${getCoverColorClass(book.id)}`}>
            <div className="text-[9px] uppercase tracking-widest opacity-85">Ebook</div>
            <div className="font-bold text-sm leading-tight line-clamp-3">{book.title}</div>
            <div className="text-[10px] opacity-75 italic truncate">{book.author}</div>
          </div>
        )}

        {/* Floating delete button on hover */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(book.id, book.title, e);
            }}
            title="Delete book"
            className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-950/70 border border-zinc-700/50 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer hover:bg-zinc-900"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Text content details */}
      <div className="mt-3 flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs truncate max-w-[80%] group-hover:text-primary transition" title={book.title}>
              {book.title}
            </h3>
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(book.id, e);
                }}
                className="hover:scale-110 transition duration-150 p-0.5 rounded-full cursor-pointer"
              >
                <FiHeart className={`w-3.5 h-3.5 ${favorite ? "fill-secondary text-secondary" : "text-text-dim"}`} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-text-dim truncate">By {book.author}</p>
        </div>

        <div className="mt-3 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[9px] text-text-dim font-bold">
            <span>
              {isCompleted ? (
                <span className="text-tertiary">Completed</span>
              ) : (
                <span>Unread</span>
              )}
            </span>
            <span>{book.progress}%</span>
          </div>
          <div className="w-full h-1 rounded-full bg-bg overflow-hidden border border-border/50">
            <div 
              className={`h-full ${isCompleted ? "bg-tertiary" : "bg-primary"} transition-all duration-300`} 
              style={{ width: `${book.progress}%` }} 
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BookCard;
