import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
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
import { invoke } from "@tauri-apps/api/core";
import Button from "../components/ui/Button";

interface OutletContextType {
  userId: number | null;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  bookIds: number[];
}

interface Book {
  id: number;
  title: string;
  author: string;
  progress: number;
}

interface TauriBook {
  book_id: number;
  title: string;
  author?: string;
}

interface ProgressItem {
  book_id: number;
  progress_percentage: number;
  last_read_at: string | null;
}

const ACCENT_COLORS = [
  { name: "Sage Green", value: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { name: "Warm Amber", value: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { name: "Terracotta", value: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { name: "Muted Blue", value: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { name: "Deep Indigo", value: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  { name: "Classic Slate", value: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
];

const CollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useOutletContext<OutletContextType>();

  const [books, setBooks] = useState<Book[]>([]);
  const [covers, setCovers] = useState<Record<number, string>>({});
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  // New collection form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [newColColor, setNewColColor] = useState(ACCENT_COLORS[0].value);

  const defaultCollections: Collection[] = [
    {
      id: "philosophy",
      name: "Philosophy & Ethics",
      description: "Meditations on existence, morality, and the nature of consciousness.",
      accentColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      bookIds: [],
    },
    {
      id: "science",
      name: "Science & Nature",
      description: "Inquiries into physical reality, taxonomy, and cosmic structure.",
      accentColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      bookIds: [],
    },
    {
      id: "fiction",
      name: "Literary Fiction",
      description: "Novels, poems, and stories that illuminate the human condition.",
      accentColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      bookIds: [],
    },
    {
      id: "history",
      name: "Historical Archives",
      description: "Primary sources, biographies, and global histories spanning Antiquity to the Modern Era.",
      accentColor: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      bookIds: [],
    }
  ];

  // Load collections from localStorage
  const loadCollections = () => {
    const saved = localStorage.getItem(`stellaron-collections-${userId}`);
    if (saved) {
      try {
        setCollections(JSON.parse(saved));
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

  const loadData = async () => {
    try {
      const allBooks = await invoke<TauriBook[]>("list_books");
      const allProgress = await invoke<ProgressItem[]>("get_all_reading_progress", { userId });

      const progressMap: Record<number, ProgressItem> = {};
      allProgress.forEach((p) => {
        progressMap[p.book_id] = p;
      });

      const formattedBooks: Book[] = allBooks.map((b) => {
        const prog = progressMap[b.book_id];
        return {
          id: b.book_id,
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
          const coverBytes = await invoke<number[]>("get_cover_img", { bookId: book.book_id });
          if (coverBytes && coverBytes.length > 0) {
            const blob = new Blob([new Uint8Array(coverBytes)], { type: "image/jpeg" });
            newCovers[book.book_id] = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.error(`Failed to load cover for book ${book.book_id}:`, e);
        }
      }
      setCovers(newCovers);
    } catch (err) {
      console.error("Failed to load books for collections:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      loadCollections();
      loadData();
    }
  }, [userId]);

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const newCol: Collection = {
      id: `col-${Date.now()}`,
      name: newColName,
      description: newColDesc,
      accentColor: newColColor,
      bookIds: [],
    };

    saveCollections([...collections, newCol]);
    setNewColName("");
    setNewColDesc("");
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

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const activeColBooks = activeCollection ? getCollectionBooks(activeCollection.id) : [];
  const unsortedBooks = getUnsortedBooks();

  return (
    <div className="w-full space-y-12 p-margin-desktop max-w-container-max mx-auto page-transition pb-24">
      
      {/* Intro Header Section */}
      <section className="space-y-4">
        <h1 className="text-3xl font-display-lg font-bold text-on-surface flex items-center gap-3">
          <FiFolder className="text-tertiary w-8 h-8" />
          <span>Curated Collections</span>
        </h1>
        <p className="font-body-lg text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Your personal taxonomy of knowledge. Organize volumes by discipline, sentiment, or narrative thread.
        </p>
      </section>

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

        {/* Philosophy & Ethics (col-span-8, row-span-2) */}
        <div 
          onClick={() => setActiveCollectionId("philosophy")}
          className="col-span-12 md:col-span-8 row-span-2 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500"
        >
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000 group-hover:opacity-80 mix-blend-luminosity" 
            alt="Philosophy cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBADxipR4kafjQ3B8ms2HYo8xOTkT89WTQd142yrxjlu-goN3ohm90i2OVZmx0F8fzm2Y3PAkOlnNczPeFHi3RRIWrkLSltQAmRiffdq1RsCGo1B2sIMZUBo3i2voMuZF3A4-rd-TjRwXN_jWJQ4c7beDY35CuY67hiyQmR84vYPKipwBvW6I_Iwy5oFLf30T1bgWTJbAb831p00dSKjElxlAFAFlDjCVnEhfNMbk3YkjlccZ2qsjxvcyhNHUi0IHqF7iEQUK8wC-s"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end glass-panel h-1/3 group-hover:h-2/5 transition-all duration-500">
            <div className="flex justify-between items-end">
              <div>
                <span className="font-label-sm text-xs text-tertiary uppercase tracking-widest mb-2 block font-semibold">{getCount("philosophy")} Volumes</span>
                <h2 className="font-display-lg text-2xl font-bold text-on-surface mb-1">Philosophy & Ethics</h2>
                <p className="font-body-md text-sm text-on-surface-variant max-w-md">Meditations on existence, morality, and the nature of consciousness.</p>
              </div>
              <div className="hidden md:flex -space-x-4">
                <div className="w-12 h-16 bg-surface-container-low border border-outline-variant/30 rounded-sm shadow-xl transform -rotate-6"></div>
                <div className="w-12 h-16 bg-surface-container border border-outline-variant/30 rounded-sm shadow-xl transform rotate-3"></div>
                <div className="w-12 h-16 bg-surface-container-high border border-outline-variant/30 rounded-sm shadow-xl transform 0"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Science & Nature (col-span-4, row-span-1) */}
        <div 
          onClick={() => setActiveCollectionId("science")}
          className="col-span-12 md:col-span-4 row-span-1 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 bg-surface-container-low"
        >
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000 mix-blend-overlay"
            alt="Science cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0ZOxxfq410kcSfE_qrDjZHcPxYzCCVpKnkaGX-z9i-w4LmBTy1jZksfVxlrl2OCCERqp-QtUmSCFXbcwUXid5QcBBpeG651F472Gjj6qh4_hAJTUE25ll5a3AyrejEJSejEaAfIk84N3Z_irEg8Nzs7AqCFu2zYpZCJfWEWfjfm4wfVwS7lZcTxW9KI-LkSfDDC30faI5h6VHsfljiSw6aqbAV_8DkiXZsVFLyoRBu9ALZppcNkjVl9ffn528Wu2peWc6tAUG44k"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 to-surface/20"></div>
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <FiCompass className="w-5 h-5 text-tertiary/50" />
              <span className="font-label-sm text-xs text-on-surface-variant font-semibold">{getCount("science")} Volumes</span>
            </div>
            <div>
              <h3 className="font-headline-md text-lg font-bold text-on-surface">Science & Nature</h3>
            </div>
          </div>
        </div>

        {/* Literary Fiction (col-span-4, row-span-1) */}
        <div 
          onClick={() => setActiveCollectionId("fiction")}
          className="col-span-12 md:col-span-4 row-span-1 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 bg-surface-container-low"
        >
          <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <FiEdit3 className="w-5 h-5 text-tertiary/50" />
              <span className="font-label-sm text-xs text-on-surface-variant font-semibold">{getCount("fiction")} Volumes</span>
            </div>
            <div>
              <h3 className="font-headline-md text-lg font-bold text-on-surface mb-2">Literary Fiction</h3>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-tertiary rounded-full"></div>
              </div>
              <p className="font-label-sm text-xs text-on-surface-variant mt-2 text-right">Recently Active</p>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none">
            <div className="absolute top-4 left-10 w-3/4 h-8 bg-on-surface border border-on-surface rounded-sm transform -rotate-12"></div>
            <div className="absolute top-12 left-12 w-3/4 h-8 bg-on-surface border border-on-surface rounded-sm transform -rotate-6"></div>
            <div className="absolute top-20 left-8 w-3/4 h-8 bg-on-surface border border-on-surface rounded-sm"></div>
          </div>
        </div>

        {/* Historical Archives (col-span-8, row-span-1) */}
        <div 
          onClick={() => setActiveCollectionId("history")}
          className="col-span-12 md:col-span-8 row-span-1 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 flex bg-surface-container"
        >
          <div className="w-1/3 h-full relative overflow-hidden">
            <img 
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000 sepia-[.3]" 
              alt="History cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLlUf9k2HWN6HAvjNGS34zqHpwj4pboo5htbpCVdpQkBPWFu6-04qg5aFaqb8o82I5UA5NepHukjgkw_DCz-Rhj3GkfzMG7r0AfhPEY9YZ-Pg6u9CSOtFe-CJsyGGthl1-3OwgUQUwPAXtkCEdabro11fUXP3Cd8I97rhixS3vwkS0FCO-qR5eEzdWlpE-KS41nMc769k2H2LyhHd7mXhWY8LNBx4EQq-UMxCUBr8uivQ0Dl8fE67zYsAIGfffAZ-AC0oXhQaqRWE"
            />
          </div>
          <div className="w-2/3 p-8 flex flex-col justify-center relative">
            <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-outline-variant/20 to-transparent"></div>
            <div className="flex justify-between items-start mb-1">
              <span className="font-label-sm text-xs text-tertiary uppercase tracking-widest font-semibold">Curated Series</span>
              <span className="font-label-sm text-xs text-on-surface-variant font-semibold">{getCount("history")} Volumes</span>
            </div>
            <h3 className="font-headline-lg text-xl font-bold text-on-surface mb-2">Historical Archives</h3>
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">Primary sources, biographies, and global histories spanning Antiquity to the Modern Era.</p>
            <div className="mt-4 flex gap-2">
              <span className="px-2.5 py-1 bg-surface-container-highest rounded-full font-label-sm text-[10px] text-on-surface-variant border border-outline-variant/10 font-bold">Antiquity</span>
              <span className="px-2.5 py-1 bg-surface-container-highest rounded-full font-label-sm text-[10px] text-on-surface-variant border border-outline-variant/10 font-bold">Renaissance</span>
            </div>
          </div>
        </div>

        {/* Dynamically Rendered Custom Collections */}
        {collections
          .filter(c => !["philosophy", "science", "fiction", "history"].includes(c.id))
          .map((col) => (
            <div 
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className="col-span-12 md:col-span-4 row-span-1 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/10 card-glow transition-all duration-500 bg-surface-container-low p-6 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${col.accentColor}`}>
                  {col.bookIds.length} Volumes
                </span>
                <button
                  onClick={(e) => handleDeleteCollection(col.id, e)}
                  className="p-1 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition cursor-pointer"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline-md text-lg font-bold text-on-surface truncate">{col.name}</h3>
                <p className="text-xs text-on-surface-variant truncate">{col.description || "No description provided."}</p>
              </div>
            </div>
          ))}

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
                      <img src={covers[book.id]} alt={book.title} className="w-full h-full object-cover rounded" />
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
                      navigate(`/book-details/${book.id}`);
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
      {activeCollection && (
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
            <div className="flex-1 my-6 overflow-y-auto no-scrollbar space-y-3">
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
                            className="w-8 h-10 object-cover rounded shadow-sm shrink-0"
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
                      <button
                        onClick={(e) => handleRemoveBookFromCollection(activeCollection.id, book.id, e)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition shrink-0 cursor-pointer"
                        title="Remove from Collection"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
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
                className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Delete Collection</span>
              </button>
              <button
                onClick={() => setActiveCollectionId(null)}
                className="px-5 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/25 rounded-lg text-xs font-bold transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal for adding collection */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-pop-in">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
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
        </div>
      )}

    </div>
  );
};

export default CollectionsPage;
