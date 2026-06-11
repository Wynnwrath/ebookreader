import React from "react";
import { FiBookOpen } from "react-icons/fi";
import { Book } from "../types";

interface BookStackProps {
  collectionBooks: Book[];
  covers: Record<number, string>;
}

const BookStack: React.FC<BookStackProps> = ({ collectionBooks, covers }) => {
  return (
    <div className="flex -space-x-4">
      {/* Show up to 3 books in a stack */}
      {collectionBooks.slice(0, 3).map((book, idx) => {
        const cover = covers[book.id];
        const rotations = ["-rotate-6", "rotate-3", "rotate-0"];
        const hoverTransforms = [
          "group-hover:-rotate-12 group-hover:-translate-x-1",
          "group-hover:rotate-6 group-hover:scale-105",
          "group-hover:rotate-0 group-hover:translate-x-1"
        ];
        const rotationClass = rotations[idx % rotations.length];
        const hoverClass = hoverTransforms[idx % hoverTransforms.length];
        
        return (
          <div 
            key={book.id} 
            className={`w-12 h-16 bg-surface-container border border-outline-variant/30 rounded-sm shadow-xl transform ${rotationClass} ${hoverClass} overflow-hidden shrink-0 transition-all duration-300`}
          >
            {cover ? (
              <img src={cover} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
                <FiBookOpen className="w-4 h-4 text-on-surface-variant/40" />
              </div>
            )}
          </div>
        );
      })}
      
      {/* If less than 3 books, fill with placeholder books */}
      {Array.from({ length: Math.max(0, 3 - collectionBooks.length) }).map((_, idx) => {
        const actualIdx = collectionBooks.length + idx;
        const rotations = ["-rotate-6", "rotate-3", "rotate-0"];
        const hoverTransforms = [
          "group-hover:-rotate-12 group-hover:-translate-x-1",
          "group-hover:rotate-6 group-hover:scale-105",
          "group-hover:rotate-0 group-hover:translate-x-1"
        ];
        const rotationClass = rotations[actualIdx % rotations.length];
        const hoverClass = hoverTransforms[actualIdx % hoverTransforms.length];
        
        return (
          <div 
            key={`placeholder-${idx}`} 
            className={`w-12 h-16 bg-surface-container-high/30 border border-outline-variant/20 rounded-sm shadow-md transform ${rotationClass} ${hoverClass} shrink-0 flex items-center justify-center transition-all duration-300`}
          >
            <span className="text-[10px] text-on-surface-variant/20 font-bold font-serif">
              {actualIdx + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BookStack;
