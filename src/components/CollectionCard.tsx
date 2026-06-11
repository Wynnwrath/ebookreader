import React from "react";
import { FiTrash2, FiFolder } from "react-icons/fi";
import { Collection, Book } from "../types";
import BookStack from "./BookStack";

interface CollectionCardProps {
  col: Collection;
  index: number;
  bookCount: number;
  covers: Record<number, string>;
  collectionBooks: Book[];
  onSelectCollection: (colId: string) => void;
  onDeleteCollection: (colId: string, e: React.MouseEvent) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  col,
  index,
  bookCount,
  covers,
  collectionBooks,
  onSelectCollection,
  onDeleteCollection,
}) => {
  const isDefaultCol = (id: string) => ["philosophy", "science", "fiction", "history"].includes(id);
  const cycleIndex = index % 4;

  if (cycleIndex === 0) {
    // Large Featured Card (8 col, 2 row)
    return (
      <div 
        onClick={() => onSelectCollection(col.id)}
        className="col-span-12 md:col-span-8 row-span-2 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500"
      >
        {col.coverImage ? (
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000 group-hover:opacity-80 mix-blend-luminosity" 
            alt={`${col.name} cover`}
            src={col.coverImage}
          />
        ) : (
          <div className={`absolute inset-0 opacity-20 ${col.accentColor.split(" ")[0]}`}></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface/40 to-transparent"></div>
        
        {!isDefaultCol(col.id) && (
          <button
            onClick={(e) => onDeleteCollection(col.id, e)}
            className="absolute top-6 right-6 p-1.5 rounded bg-surface-container/60 hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition cursor-pointer z-20"
            title="Delete Collection"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}

        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end glass-panel h-1/3 group-hover:h-2/5 transition-all duration-500">
          <div className="flex justify-between items-end">
            <div className="min-w-0 pr-4">
              <span className="font-label-sm text-xs text-tertiary uppercase tracking-widest mb-2 block font-semibold">{bookCount} Volumes</span>
              <h2 className="font-display-lg text-2xl font-bold text-on-surface mb-1 truncate">{col.name}</h2>
              <p className="font-body-md text-sm text-on-surface-variant max-w-md line-clamp-2">{col.description || "No description provided."}</p>
            </div>
            <div className="hidden md:flex shrink-0">
              <BookStack collectionBooks={collectionBooks} covers={covers} />
            </div>
          </div>
        </div>
      </div>
    );
  } else if (cycleIndex === 1 || cycleIndex === 2) {
    // Compact Card (4 col, 1 row)
    return (
      <div 
        onClick={() => onSelectCollection(col.id)}
        className="col-span-12 md:col-span-4 row-span-1 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 bg-surface-container-low"
      >
        {col.coverImage ? (
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 mix-blend-overlay"
            alt={`${col.name} cover`}
            src={col.coverImage}
          />
        ) : (
          <div className={`absolute inset-0 opacity-20 ${col.accentColor.split(" ")[0]}`}></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 to-surface/20"></div>
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${col.accentColor}`}>
                {bookCount} Volumes
              </span>
              {!isDefaultCol(col.id) && (
                <button
                  onClick={(e) => onDeleteCollection(col.id, e)}
                  className="p-1 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition cursor-pointer relative z-20"
                  title="Delete Collection"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <BookStack collectionBooks={collectionBooks} covers={covers} />
          </div>
          <div className="min-w-0">
            <h3 className="font-headline-md text-lg font-bold text-on-surface truncate group-hover:text-tertiary transition-colors">{col.name}</h3>
            <p className="text-xs text-on-surface-variant truncate mt-1">{col.description || "No description provided."}</p>
          </div>
        </div>
      </div>
    );
  } else {
    // Horizontal Card (8 col, 1 row)
    return (
      <div 
        onClick={() => onSelectCollection(col.id)}
        className="col-span-12 md:col-span-8 row-span-1 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 flex bg-surface-container"
      >
        <div className="w-1/3 h-full relative overflow-hidden">
          {col.coverImage ? (
            <img 
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000 sepia-[.3]" 
              alt={`${col.name} cover`}
              src={col.coverImage}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-surface-container-high`}>
              <FiFolder className="w-8 h-8 text-on-surface-variant/30" />
            </div>
          )}
        </div>
        
        {!isDefaultCol(col.id) && (
          <button
            onClick={(e) => onDeleteCollection(col.id, e)}
            className="absolute top-6 right-6 p-1.5 rounded bg-surface-container/60 hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition cursor-pointer z-20"
            title="Delete Collection"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}

        <div className="w-2/3 p-6 md:p-8 flex flex-col justify-center relative min-w-0">
          <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-outline-variant/20 to-transparent"></div>
          <div className="flex justify-between items-start mb-1">
            <span className="font-label-sm text-xs text-tertiary uppercase tracking-widest font-semibold">Curated Series</span>
            <span className="font-label-sm text-xs text-on-surface-variant font-semibold">{bookCount} Volumes</span>
          </div>
          <h3 className="font-headline-lg text-xl font-bold text-on-surface mb-2 truncate group-hover:text-tertiary transition-colors">{col.name}</h3>
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed line-clamp-2">{col.description || "No description provided."}</p>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 bg-surface-container-highest rounded-full font-label-sm text-[10px] text-on-surface-variant border border-outline-variant/10 font-bold ${col.accentColor.split(" ")[1] || ""}`}>
                Active Archive
              </span>
            </div>
            <div className="flex shrink-0">
              <BookStack collectionBooks={collectionBooks} covers={covers} />
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default CollectionCard;
