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
import { tauriService } from "../services/tauriService";
import { Collection, Book, TauriBook, ProgressItem } from "../types";

interface OutletContextType {
  userId: number | null;
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
  const { userId } = useOutletContext<OutletContextType>();

  const [books, setBooks] = useState<Book[]>([]);
  const [covers, setCovers] = useState<Record<number, string>>({});
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // New collection form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [newColColor, setNewColColor] = useState(ACCENT_COLORS[0].value);
  const [newColImage, setNewColImage] = useState(IMAGE_PRESETS[0].value);

  const defaultCollections: Collection[] = [
    {
      id: "philosophy",
      name: "Philosophy & Ethics",
      description: "Meditations on existence, morality, and the nature of consciousness.",
      accentColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      bookIds: [],
      coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBADxipR4kafjQ3B8ms2HYo8xOTkT89WTQd142yrxjlu-goN3ohm90i2OVZmx0F8fzm2Y3PAkOlnNczPeFHi3RRIWrkLSltQAmRiffdq1RsCGo1B2sIMZUBo3i2voMuZF3A4-rd-TjRwXN_jWJQ4c7beDY35CuY67hiyQmR84vYPKipwBvW6I_Iwy5oFLf30T1bgWTJbAb831p00dSKjElxlAFAFlDjCVnEhfNMbk3YkjlccZ2qsjxvcyhNHUi0IHqF7iEQUK8wC-s",
    },
    {
      id: "science",
      name: "Science & Nature",
      description: "Inquiries into physical reality, taxonomy, and cosmic structure.",
      accentColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      bookIds: [],
      coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0ZOxxfq410kcSfE_qrDjZHcPxYzCCVpKnkaGX-z9i-w4LmBTy1jZksfVxlrl2OCCERqp-QtUmSCFXbcwUXid5QcBBpeG651F472Gjj6qh4_hAJTUE25ll5a3AyrejEJSejEaAfIk84N3Z_irEg8Nzs7AqCFu2zYpZCJfWEWfjfm4wfVwS7lZcTxW9KI-LkSfDDC30faI5h6VHsfljiSw6aqbAV_8DkiXZsVFLyoRBu9ALZppcNkjVl9ffn528Wu2peWc6tAUG44k",
    },
    {
      id: "fiction",
      name: "Literary Fiction",
      description: "Novels, poems, and stories that illuminate the human condition.",
      accentColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      bookIds: [],
      coverImage: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: "history",
      name: "Historical Archives",
      description: "Primary sources, biographies, and global histories spanning Antiquity to the Modern Era.",
      accentColor: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      bookIds: [],
      coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlUf9k2HWN6HAvjNGS34zqHpwj4pboo5htbpCVdpQkBPWFu6-04qg5aFaqb8o82I5UA5NepHukjgkw_DCz-Rhj3GkfzMG7r0AfhPEY9YZ-Pg6u9CSOtFe-CJsyGGthl1-3OwgUQUwPAXtkCEdabro11fUXP3Cd8I97rhixS3vwkS0FCO-qR5eEzdWlpE-KS41nMc769k2H2LyhHd7mXhWY8LNBx4EQq-UMxCUBr8uivQ0Dl8fE67zYsAIGfffAZ-AC0oXhQaqRWE",
    }
  ];

  // Load collections from localStorage with migration logic
  const loadCollections = () => {
    const saved = localStorage.getItem(`stellaron-collections-${userId}`);
    if (saved) {
      try {
        const parsed: Collection[] = JSON.parse(saved);
        const migrated = parsed.map(c => {
          const matchingDefault = defaultCollections.find(d => d.id === c.id);
          if (matchingDefault) {
            return {
              ...matchingDefault,
              bookIds: c.bookIds, // preserve user's book associations
            };
          }
          return c;
        });
        setCollections(migrated);
      } catch (e) {
        setCollections(defaultCollections);
      }
    } else {
      setCollections(defaultCollections);
      localStorage.setItem(`stellaron-collections-${userId}`, JSON.stringify(defaultCollections));
    }
  };

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

  const handleDeleteCollection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleRemoveBookFromCollection = (collectionId: string, bookId: number, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const activeColBooks = activeCollection ? getCollectionBooks(activeCollection.id) : [];
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
      {activeCollection && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border-l border-outline-variant/20 h-full w-full max-w-lg shadow-2xl p-8 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            {/* Header info */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${activeCollection.accentColor}`}>
                  {activeColBooks.length} Volumes
                </span>
                <button 
                  onClick={() => setActiveCollectionId(null)}
                  className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-display-lg font-bold text-on-surface">{activeCollection.name}</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">{activeCollection.description}</p>
              </div>

              {/* Quick Add Volume */}
              <div className="pt-4 border-t border-outline-variant/15 space-y-2">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Add Volume to Collection</h4>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignBook(activeCollection.id, Number(e.target.value));
                      e.target.value = "";
                    }
                  }}
                  className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-tertiary"
                  defaultValue=""
                >
                  <option value="" disabled>Choose a book to add...</option>
                  {books
                    .filter(b => !activeCollection.bookIds.includes(b.id))
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
              {activeColBooks.length === 0 ? (
                <p className="text-sm text-on-surface-variant italic py-8 text-center border border-dashed border-outline-variant/20 rounded-xl">
                  No volumes in this collection yet. Select a volume from the dropdown above to catalog it!
                </p>
              ) : (
                <div className="space-y-2">
                  {activeColBooks.map((book) => (
                    <div 
                      key={book.id}
                      onClick={() => {
                        setActiveCollectionId(null);
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
                            setActiveCollectionId(null);
                            navigate(`/book/${book.id}`);
                          }}
                          className="p-1.5 rounded hover:bg-tertiary/10 text-on-surface-variant hover:text-tertiary transition cursor-pointer"
                          title="Read Now"
                        >
                          <FiPlay className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleRemoveBookFromCollection(activeCollection.id, book.id, e)}
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
                onClick={(e) => {
                  handleDeleteCollection(activeCollection.id, e);
                  setActiveCollectionId(null);
                }}
                className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition animate-pop-in"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Delete Collection</span>
              </button>
              <button
                onClick={() => setActiveCollectionId(null)}
                className="px-5 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/25 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

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
