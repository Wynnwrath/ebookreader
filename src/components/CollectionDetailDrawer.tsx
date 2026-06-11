import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiX, FiBookOpen, FiPlay, FiTrash2 } from "react-icons/fi";
import { Book, Collection } from "../types";

interface CollectionDetailDrawerProps {
  isOpen: boolean;
  activeCollectionId: string | null;
  onClose: () => void;
  displayCollection: Collection | null;
  displayColBooks: Book[];
  covers: Record<number, string>;
  books: Book[];
  onAssignBook: (collectionId: string, bookId: number) => void;
  onRemoveBook: (collectionId: string, bookId: number) => void;
  onDeleteCollection: (collectionId: string) => void;
}

const CollectionDetailDrawer: React.FC<CollectionDetailDrawerProps> = ({
  isOpen,
  activeCollectionId,
  onClose,
  displayCollection,
  displayColBooks,
  covers,
  books,
  onAssignBook,
  onRemoveBook,
  onDeleteCollection,
}) => {
  const navigate = useNavigate();

  const [localCollection, setLocalCollection] = useState<Collection | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (displayCollection) {
      setLocalCollection(displayCollection);
      const timer = setTimeout(() => {
        setAnimateIn(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => {
        setLocalCollection(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [displayCollection]);

  if (!localCollection) return null;

  const booksInCollection = books.filter(b => localCollection.bookIds.includes(b.id));

  return createPortal(
    <div 
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-all duration-300 ${
        animateIn 
          ? "opacity-100 pointer-events-auto" 
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-surface-container-lowest border-l border-outline-variant/20 h-full w-full max-w-lg shadow-2xl p-8 flex flex-col justify-between origin-right reader-drawer-right transition-all duration-300 ${
          animateIn 
            ? "translate-x-0 opacity-100 pointer-events-auto" 
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        
        {/* Header info */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${localCollection.accentColor}`}>
              {booksInCollection.length} Volumes
            </span>
            <button 
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display-lg font-bold text-on-surface">{localCollection.name}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">{localCollection.description}</p>
          </div>

          {/* Quick Add Volume */}
          <div className="pt-4 border-t border-outline-variant/15 space-y-2">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Add Volume to Collection</h4>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onAssignBook(localCollection.id, Number(e.target.value));
                  e.target.value = "";
                }
              }}
              className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-tertiary"
              defaultValue=""
            >
              <option value="" disabled>Choose a book to add...</option>
              {books
                .filter(b => !localCollection.bookIds.includes(b.id))
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Books in collection (Middle Scrollable) */}
        <div className="flex-1 my-6 overflow-y-auto min-h-0 no-scrollbar space-y-3">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Catalogued Volumes</h3>
          {booksInCollection.length === 0 ? (
            <p className="text-sm text-on-surface-variant italic py-8 text-center border border-dashed border-outline-variant/20 rounded-xl">
              No volumes in this collection yet. Select a volume from the dropdown above to catalog it!
            </p>
          ) : (
            <div className="space-y-2">
              {booksInCollection.map((book) => (
                <div 
                  key={book.id}
                  onClick={() => {
                    onClose();
                    navigate(`/book-details/${book.id}`);
                  }}
                  className="flex items-center justify-between p-3 rounded-lg border border-outline-variant/10 bg-surface-container/50 hover:bg-surface-container-high/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {covers[book.id] ? (
                      <img 
                        src={covers[book.id]} 
                        alt={book.title} 
                        className="w-8 h-10 object-cover rounded shadow-sm shrink-0 cover-image"
                      />
                    ) : (
                      <div className="w-8 h-10 rounded bg-surface border border-outline-variant/20 flex items-center justify-center shrink-0">
                        <FiBookOpen className="w-4 h-4 text-on-surface-variant" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-tertiary transition-colors">{book.title}</h4>
                      <p className="text-[10px] text-on-surface-variant truncate">{book.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        navigate(`/book/${book.id}`);
                      }}
                      className="p-1.5 rounded hover:bg-tertiary/10 text-on-surface-variant hover:text-tertiary transition cursor-pointer"
                      title="Read Now"
                    >
                      <FiPlay className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBook(localCollection.id, book.id);
                      }}
                      className="p-1.5 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition shrink-0 cursor-pointer"
                      title="Remove from Collection"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          <button
            onClick={() => {
              onDeleteCollection(localCollection.id);
            }}
            className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition animate-pop-in cursor-pointer"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Delete Collection</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/25 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CollectionDetailDrawer;
