import React, { useState } from "react";
import { FiBookmark } from "react-icons/fi";
import { ExtendedAnnotation } from "../types";
import { formatLastRead } from "../utils/formatters";

interface ReadersJournalProps {
  recentAnnotations: ExtendedAnnotation[];
  onNavigateToBookDetails: (bookId: number) => void;
}

const ReadersJournal: React.FC<ReadersJournalProps> = ({
  recentAnnotations,
  onNavigateToBookDetails,
}) => {
  const literaryQuotes = [
    { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" },
    { text: "A room without books is like a body without a soul.", author: "Cicero" },
    { text: "Books are a uniquely portable magic.", author: "Stephen King" },
    { text: "Reading is a conversation. All books talk. But a good book listens as well.", author: "Mark Haddon" },
    { text: "Quiet rooms, full of books, are the best places in the world.", author: "Charles Dickens" }
  ];

  const [currentQuote] = useState<{ text: string; author: string }>(
    () => literaryQuotes[Math.floor(Math.random() * literaryQuotes.length)]
  );

  return (
    <div className="lg:col-span-2 bg-surface-container-low/50 border border-outline-variant/15 rounded-2xl p-6 space-y-6 flex flex-col justify-between min-h-[300px]">
      <div className="space-y-2">
        <h2 className="text-xl font-serif font-bold text-on-surface flex items-center gap-2.5">
          <FiBookmark className="text-tertiary w-5 h-5" />
          <span>Reader's Journal</span>
        </h2>
        <p className="text-xs text-on-surface-variant/75 font-sans">
          A curated feed of your latest thoughts, highlighted passages, and bookmarks.
        </p>
      </div>

      {recentAnnotations.length > 0 ? (
        <div className="space-y-4 flex-1 mt-4">
          {recentAnnotations.map((annotation) => (
            <div 
              key={annotation.id}
              onClick={() => onNavigateToBookDetails(annotation.book_id)}
              className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/10 hover:border-tertiary/30 hover:bg-surface-container transition-all duration-200 cursor-pointer space-y-2"
            >
              <div className="flex justify-between items-center text-[10px] font-sans text-on-surface-variant/60 font-bold">
                <span>{annotation.bookTitle} &bull; {annotation.chapter_title || "General"}</span>
                <span>{annotation.created_at ? formatLastRead(annotation.created_at) : ""}</span>
              </div>
              {annotation.highlighted_text && (
                <blockquote className="font-serif italic text-sm text-on-surface border-l-2 border-tertiary pl-3 py-0.5 leading-relaxed line-clamp-2">
                  "{annotation.highlighted_text}"
                </blockquote>
              )}
              {annotation.note && (
                <p className="text-xs text-on-surface-variant font-sans bg-surface-container-high/40 p-2 rounded-lg border border-outline-variant/5">
                  <span className="font-bold text-[10px] uppercase text-tertiary block mb-1">Your Note</span>
                  {annotation.note}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Literary Quote Fallback */
        <div className="flex-1 flex flex-col justify-center items-center text-center p-8 mt-4 rounded-xl border border-dashed border-outline-variant/20 bg-surface-container/10">
          <blockquote className="font-serif italic text-lg text-on-surface-variant max-w-lg leading-relaxed relative">
            <span className="absolute -top-6 -left-4 text-5xl text-tertiary/20 font-serif">“</span>
            {currentQuote.text}
            <span className="absolute -bottom-10 -right-4 text-5xl text-tertiary/20 font-serif">”</span>
          </blockquote>
          <cite className="font-sans text-[11px] font-bold text-tertiary uppercase tracking-widest mt-6 block">
            — {currentQuote.author}
          </cite>
        </div>
      )}
    </div>
  );
};

export default ReadersJournal;
