import React from "react";
import { FiChevronRight, FiFolder } from "react-icons/fi";
import { Collection } from "../types";

interface HomeCollectionsProps {
  collections: Collection[];
  onSelectCollection: (colId: string) => void;
  onManageCollections: () => void;
}

const HomeCollections: React.FC<HomeCollectionsProps> = ({
  collections,
  onSelectCollection,
  onManageCollections,
}) => {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
        <h2 className="font-serif text-2xl font-bold text-on-surface">Collections & Curations</h2>
        <button 
          onClick={onManageCollections}
          className="font-sans text-xs text-on-surface-variant/85 hover:text-tertiary transition-colors flex items-center gap-1 font-bold cursor-pointer"
        >
          Manage Collections <FiChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {collections.length <= 4 ? (
          collections.map((col) => (
            <div 
              key={col.id}
              onClick={() => onSelectCollection(col.id)}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 bg-surface-container-low shadow-sm"
            >
              {col.coverImage ? (
                <img 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity" 
                  alt={`${col.name} cover`}
                  src={col.coverImage}
                />
              ) : (
                <div className={`absolute inset-0 opacity-20 ${col.accentColor.split(" ")[0]}`}></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface/40 to-transparent"></div>
              
              <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border bg-surface-container/60 ${col.accentColor}`}>
                    {col.bookIds.length} VOLUMES
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-base font-bold text-on-surface truncate group-hover:text-tertiary transition-colors">{col.name}</h3>
                  <p className="text-xs text-on-surface-variant/90 truncate mt-1">{col.description || "Curated book list."}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            {collections.slice(0, 3).map((col) => (
              <div 
                key={col.id}
                onClick={() => onSelectCollection(col.id)}
                className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 bg-surface-container-low shadow-sm"
              >
                {col.coverImage ? (
                  <img 
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity" 
                    alt={`${col.name} cover`}
                    src={col.coverImage}
                  />
                ) : (
                  <div className={`absolute inset-0 opacity-20 ${col.accentColor.split(" ")[0]}`}></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface/40 to-transparent"></div>
                
                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border bg-surface-container/60 ${col.accentColor}`}>
                      {col.bookIds.length} VOLUMES
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-base font-bold text-on-surface truncate group-hover:text-tertiary transition-colors">{col.name}</h3>
                    <p className="text-xs text-on-surface-variant/90 truncate mt-1">{col.description || "Curated book list."}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* More Collections Card */}
            <div 
              onClick={onManageCollections}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-outline-variant/15 border-dashed bg-surface-container-low/40 hover:bg-surface-container-high/60 transition-all duration-500 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/10 group-hover:bg-tertiary/10 transition-colors">
                <FiChevronRight className="text-lg text-on-surface-variant group-hover:text-tertiary transition-colors" />
              </div>
              <span className="font-semibold text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                + {collections.length - 3} More Collections
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HomeCollections;
