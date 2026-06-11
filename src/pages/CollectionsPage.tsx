import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import CollectionDetailDrawer from "../components/CollectionDetailDrawer";
import NewCollectionModal from "../components/NewCollectionModal";
import CollectionCard from "../components/CollectionCard";
import UnsortedBooks from "../components/UnsortedBooks";
import { Collection, AppOutletContext } from "../types";
import { useBooksWithProgress } from "../hooks/useBooksWithProgress";
import { useBookCovers } from "../hooks/useBookCovers";

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
  } = useOutletContext<AppOutletContext>();

  // Custom hooks replacing duplicate local state & logic
  const { books, loadData } = useBooksWithProgress(userId ?? 1);
  const { covers, loadCovers } = useBookCovers();

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);

  const saveCollections = (updated: Collection[]) => {
    setCollections(updated);
    localStorage.setItem(`stellaron-collections-${userId}`, JSON.stringify(updated));
  };

  useEffect(() => {
    if (userId) {
      loadCollections();
      loadData(books.length > 0);
    }
  }, [userId]);

  useEffect(() => {
    if (books.length > 0) {
      loadCovers(books.map(b => b.id));
    }
  }, [books, loadCovers]);

  // Deep linking logic from Dashboard
  useEffect(() => {
    if (location.state?.activeCollectionId) {
      setActiveCollectionId(location.state.activeCollectionId);
      // Clean up the location state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, setActiveCollectionId]);

  const handleCreateCollection = (name: string, desc: string, color: string, image: string) => {
    const newCol: Collection = {
      id: `col-${Date.now()}`,
      name,
      description: desc,
      accentColor: color,
      bookIds: [],
      coverImage: image || undefined,
    };
    saveCollections([...collections, newCol]);
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
    return books.filter(b => {
      const col = collections.find(c => c.id === colId);
      return col ? col.bookIds.includes(b.id) : false;
    });
  };

  const getUnsortedBooks = () => {
    const allAssignedIds = new Set(collections.flatMap(c => c.bookIds));
    return books.filter(b => !allAssignedIds.has(b.id));
  };

  const getCount = (colId: string) => {
    return collections.find(c => c.id === colId)?.bookIds.length || 0;
  };

  const activeCollection = collections.find(c => c.id === activeCollectionId) || null;
  const displayColBooks = activeCollection ? getCollectionBooks(activeCollection.id) : [];
  const unsortedBooks = getUnsortedBooks();

  return (
    <div className="w-full space-y-8 p-margin-desktop max-w-container-max mx-auto page-transition pb-24 text-on-surface">
      
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
        {collections.map((col, index) => (
          <CollectionCard 
            key={col.id}
            col={col}
            index={index}
            bookCount={getCount(col.id)}
            covers={covers}
            collectionBooks={getCollectionBooks(col.id)}
            onSelectCollection={(colId) => setActiveCollectionId(colId)}
            onDeleteCollection={handleDeleteCollection}
          />
        ))}

      </div>

      {/* Unsorted Volumes (List view) */}
      <UnsortedBooks 
        unsortedBooks={unsortedBooks}
        covers={covers}
        onNavigateToBookDetails={(id) => navigate(`/book-details/${id}`)}
        onNavigateToBookReader={(id) => navigate(`/book/${id}`)}
      />

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
      <NewCollectionModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreateCollection={handleCreateCollection}
      />

    </div>
  );
};

export default CollectionsPage;
