import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { 
  FiFolder, 
  FiPlus, 
  FiTrash2, 
  FiBookOpen, 
  FiFolderPlus,
  FiX,
  FiPlay,
  FiTag,
  FiBookmark,
  FiCompass,
  FiEdit3
} from "react-icons/fi";
import Button from "../components/ui/Button";
import CollectionDetailDrawer from "../components/CollectionDetailDrawer";
import { tauriService } from "../services/tauriService";
import { Collection, Book, TauriBook, ProgressItem } from "../types";

interface OutletContextType {
  userId: number | null;
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  activeCollectionId: string | null;
  setActiveCollectionId: React.Dispatch<React.SetStateAction<string | null>>;
  loadCollections: () => void;
}

const ACCENT_COLORS = [
  { name: "Sage Green", value: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { name: "Warm Amber", value: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { name: "Terracotta", value: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { name: "Muted Blue", value: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { name: "Deep Indigo", value: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  { name: "Classic Slate", value: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
];

const IMAGE_PRESETS = [
  { name: "Classic Library", value: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600" },
  { name: "Cosmic Nebula", value: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600" },
  { name: "Abstract Fluid", value: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600" },
  { name: "Vintage Paper", value: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600" },
  { name: "Minimalist Grid", value: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=600" },
];

const CollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    userId,
    collections,
    setCollections,
    activeCollectionId,
    setActiveCollectionId,
    loadCollections
  } = useOutletContext<OutletContextType>();

  const [books, setBooks] = useState<Book[]>([]);
  const [covers, setCovers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // New collection form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [newColColor, setNewColColor] = useState(ACCENT_COLORS[0].value);
  const [newColImage, setNewColImage] = useState(IMAGE_PRESETS[0].value);

  const saveCollections = (updated: Collection[]) => {
    setCollections(updated);
    localStorage.setItem(`stellaron-collections-${userId}`, JSON.stringify(updated));
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const allBooks = await tauriService.listBooks();
      
      const progressPromises = allBooks.map(async (b) => {
        try {
          const p = await tauriService.getReadingProgress<ProgressItem | null>({ bookId: b.id });
          return p;
        } catch {
          return null;
        }
      });
      const progressResults = await Promise.all(progressPromises);
      const allProgress = progressResults.filter((p): p is ProgressItem => p !== null);

      const progressMap: Record<number, ProgressItem> = {};
      allProgress.forEach((p) => {
        progressMap[p.book_id] = p;
      });

      const formattedBooks: Book[] = allBooks.map((b) => {
        const prog = progressMap[b.id];
        return {
          id: b.id,
          title: b.title,
          author: b.author || "Unknown Author",
          progress: prog ? Math.round(prog.progress_percentage || 0) : 0,
        };
      });

      setBooks(formattedBooks);

      // Load covers
      const newCovers: Record<number, string> = {};
      for (const book of allBooks) {
        try {
          const coverBytes = await tauriService.getCoverImg(book.id);
          if (coverBytes && coverBytes.length > 0) {
            const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
            newCovers[book.id] = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.error(`Failed to load cover for book ${book.id}:`, e);
        }
      }
      setCovers(newCovers);
    } catch (err) {
      console.error("Failed to load books for collections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadCollections();
      const isInitial = books.length === 0;
      loadData(!isInitial);
    }
  }, [userId]);

  // Deep linking logic from Dashboard
  useEffect(() => {
    if (location.state?.activeCollectionId) {
      setActiveCollectionId(location.state.activeCollectionId);
      // Clean up the location state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);



  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const newCol: Collection = {
      id: `col-${Date.now()}`,
      name: newColName,
      description: newColDesc,
      accentColor: newColColor,
      bookIds: [],
      coverImage: newColImage || undefined,
    };

    saveCollections([...collections, newCol]);
    setNewColName("");
    setNewColDesc("");
    setNewColImage(IMAGE_PRESETS[0].value);
    setShowAddModal(false);
  };

  const handleDeleteCollection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this collection? Books inside will not be deleted.")) {
      const updated = collections.filter(c => c.id !== id);
      saveCollections(updated);
      if (activeCollectionId === id) setActiveCollectionId(null);
    }
  };

  const handleAssignBook = (collectionId: string, bookId: number) => {
    const updated = collections.map(c => {
      if (c.id === collectionId) {
        if (!c.bookIds.includes(bookId)) {
          return { ...c, bookIds: [...c.bookIds, bookId] };
        }
      }
      return c;
    });
    saveCollections(updated);
  };

  const handleRemoveBookFromCollection = (collectionId: string, bookId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, bookIds: c.bookIds.filter(id => id !== bookId) };
      }
      return c;
    });
    saveCollections(updated);
  };

  const getCollectionBooks = (colId: string) => {
    const col = collections.find(c => c.id === colId);
    if (!col) return [];
    return books.filter(b => col.bookIds.includes(b.id));
  };

  const getUnsortedBooks = () => {
    const allAssignedIds = new Set(collections.flatMap(c => c.bookIds));
    return books.filter(b => !allAssignedIds.has(b.id));
  };

  const getCount = (colId: string) => {
    return collections.find(c => c.id === colId)?.bookIds.length || 0;
  };

  const isDefaultCol = (id: string) => ["philosophy", "science", "fiction", "history"].includes(id);

  const renderBookStack = (collection: Collection) => {
    const collectionBooks = getCollectionBooks(collection.id);
    
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

  const renderCollectionCard = (col: Collection, index: number) => {
    const bookCount = getCount(col.id);
    const cycleIndex = index % 4;
    
    if (cycleIndex === 0) {
      // Large Featured Card (8 col, 2 row)
      return (
        <div 
          key={col.id}
          onClick={() => setActiveCollectionId(col.id)}
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
              onClick={(e) => handleDeleteCollection(col.id, e)}
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
                {renderBookStack(col)}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (cycleIndex === 1 || cycleIndex === 2) {
      // Compact Card (4 col, 1 row)
      return (
        <div 
          key={col.id}
          onClick={() => setActiveCollectionId(col.id)}
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
                    onClick={(e) => handleDeleteCollection(col.id, e)}
                    className="p-1 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition cursor-pointer relative z-20"
                    title="Delete Collection"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {renderBookStack(col)}
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
          key={col.id}
          onClick={() => setActiveCollectionId(col.id)}
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
              onClick={(e) => handleDeleteCollection(col.id, e)}
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
                {renderBookStack(col)}
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const activeCollection = collections.find(c => c.id === activeCollectionId) || null;
  const displayColBooks = activeCollection ? getCollectionBooks(activeCollection.id) : [];
  const unsortedBooks = getUnsortedBooks();

  return (
    <div className="w-full space-y-8 p-margin-desktop max-w-container-max mx-auto page-transition pb-24">
      
      {/* Bento Grid Layout for Collections */}
      <div className="grid grid-cols-12 gap-6 auto-rows-[240px]">
        
        {/* Create New Collection Card */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="col-span-12 md:col-span-4 row-span-1 glass-panel rounded-xl border border-outline-variant/20 border-dashed hover:border-tertiary/50 hover:bg-surface-container-high/60 transition-all duration-500 flex flex-col items-center justify-center gap-4 group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-tertiary/10 transition-colors border border-outline-variant/10">
            <FiPlus className="text-2xl text-on-surface-variant group-hover:text-tertiary transition-colors" />
          </div>
          <span className="font-headline-md text-lg text-on-surface-variant group-hover:text-on-surface transition-colors">New Collection</span>
        </button>

        {/* Dynamic Bento Cards for Collections */}
        {collections.map((col, index) => renderCollectionCard(col, index))}

      </div>

      {/* Unsorted Volumes (List view) */}
      <section className="space-y-4 pt-6">
        <div className="flex justify-between items-end border-b border-outline-variant/10 pb-4">
          <h3 className="font-headline-md text-xl font-bold text-on-surface">Unsorted Volumes</h3>
          <span className="text-xs font-semibold text-on-surface-variant">{unsortedBooks.length} Books</span>
        </div>

        {unsortedBooks.length === 0 ? (
          <p className="text-sm text-on-surface-variant italic py-4">All books have been catalogued into collections.</p>
        ) : (
          <div className="space-y-2.5">
            {unsortedBooks.map((book) => (
              <div 
                key={book.id}
                onClick={() => navigate(`/book-details/${book.id}`)}
                className="flex items-center justify-between p-4 bg-surface-container/30 border border-outline-variant/10 rounded-xl hover:bg-surface-container-high/40 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-14 bg-surface-container-highest border border-outline-variant/20 rounded shadow-sm flex items-center justify-center shrink-0">
                    {covers[book.id] ? (
                      <img src={covers[book.id]} alt={book.title} className="w-full h-full object-cover rounded cover-image" />
                    ) : (
                      <FiBookOpen className="text-on-surface-variant/40 w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-headline-md text-base font-bold text-on-surface group-hover:text-tertiary transition-colors">{book.title}</h4>
                    <p className="font-label-sm text-xs text-on-surface-variant">{book.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-label-sm text-xs text-on-surface-variant/50">Unsorted</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/book/${book.id}`);
                    }}
                    className="p-2 rounded-full hover:bg-tertiary/10 text-on-surface-variant group-hover:text-tertiary transition-all"
                  >
                    <FiPlay className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Collection Detail Drawer / Modal Overlay */}
      <CollectionDetailDrawer
        isOpen={activeCollectionId !== null}
        activeCollectionId={activeCollectionId}
        onClose={() => setActiveCollectionId(null)}
        displayCollection={activeCollection}
        displayColBooks={displayColBooks}
        covers={covers}
        books={books}
        onAssignBook={handleAssignBook}
        onRemoveBook={handleRemoveBookFromCollection}
        onDeleteCollection={handleDeleteCollection}
      />

      {/* Modal for adding collection */}
      {showAddModal && createPortal(
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-surface-container border border-outline-variant/20 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-pop-in text-on-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-headline-md font-bold text-on-surface">Create Collection</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Philosophical Treatises"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-tertiary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="A brief commentary or theme statement..."
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-tertiary resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Collection Backdrop Image</label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setNewColImage(preset.value)}
                      className={`aspect-video rounded-lg overflow-hidden border cursor-pointer transition relative group/preset ${
                        newColImage === preset.value ? "ring-2 ring-tertiary ring-offset-2 ring-offset-surface-container-low" : "border-outline-variant/30 hover:border-outline-variant/60"
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.value} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preset:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">{preset.name.split(" ")[0]}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or paste custom image URL..."
                  value={newColImage}
                  onChange={(e) => setNewColImage(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-tertiary text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Color Accent</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setNewColColor(col.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition ${col.value} ${
                        newColColor === col.value ? "ring-2 ring-tertiary ring-offset-2 ring-offset-surface-container-lowest" : "opacity-75 hover:opacity-100"
                      }`}
                    >
                      {col.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-outline-variant/20 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-tertiary text-on-tertiary font-bold rounded-lg text-xs hover:bg-tertiary/90 transition shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default CollectionsPage;
