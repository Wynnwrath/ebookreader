import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { tauriService } from "../services/tauriService";
import { Collection, ExtendedAnnotation, AppOutletContext } from "../types";
import CollectionDetailDrawer from "../components/CollectionDetailDrawer";
import { useBooksWithProgress } from "../hooks/useBooksWithProgress";
import { useBookCovers } from "../hooks/useBookCovers";
import { useImport } from "../hooks/useImport";

import HomeHeader from "../components/HomeHeader";
import ActiveDesk from "../components/ActiveDesk";
import HomeCollections from "../components/HomeCollections";
import ReadersJournal from "../components/ReadersJournal";
import LibraryOverview from "../components/LibraryOverview";
import ReadingQueue from "../components/ReadingQueue";
import LibraryShelf from "../components/LibraryShelf";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    userId, 
    importTrigger,
    collections,
    setCollections,
    activeCollectionId,
    setActiveCollectionId,
    loadCollections
  } = useOutletContext<AppOutletContext>();

  // custom hooks
  const { books, loading: loadingBooks, streakDays, loadData } = useBooksWithProgress(userId);
  const { covers, loading: loadingCovers, loadCovers } = useBookCovers();
  const { handleImport, handleImportFolder } = useImport({
    onSuccess: () => loadData(true)
  });

  const [recentAnnotations, setRecentAnnotations] = useState<ExtendedAnnotation[]>([]);

  const saveCollections = (updated: Collection[]) => {
    setCollections(updated);
    localStorage.setItem(`stellaron-collections-${userId}`, JSON.stringify(updated));
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

  const handleDeleteCollection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this collection? Books inside will not be deleted.")) {
      const updated = collections.filter(c => c.id !== id);
      saveCollections(updated);
      if (activeCollectionId === id) setActiveCollectionId(null);
    }
  };

  const displayCollection = collections.find(c => c.id === activeCollectionId) || null;
  const displayColBooks = displayCollection 
    ? books.filter(b => displayCollection.bookIds.includes(b.id)) 
    : [];

  // Load covers when books are loaded
  useEffect(() => {
    if (books.length > 0) {
      loadCovers(books.map(b => b.id));
    }
  }, [books, loadCovers]);

  // Load recent annotations when books change
  useEffect(() => {
    const fetchAnnotations = async () => {
      if (books.length === 0) return;
      const annotationPromises = books.slice(0, 3).map(async (b) => {
        try {
          const annList = await tauriService.getAnnotations({ bookId: b.id });
          return annList.map(ann => ({ ...ann, bookTitle: b.title, bookAuthor: b.author }));
        } catch {
          return [];
        }
      });
      const annotationLists = await Promise.all(annotationPromises);
      const allAnnotations = annotationLists.flat();
      const sortedAnnotations = allAnnotations.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at.replace(" ", "T")).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at.replace(" ", "T")).getTime() : 0;
        return bTime - aTime;
      });
      setRecentAnnotations(sortedAnnotations.slice(0, 3));
    };
    fetchAnnotations();
  }, [books]);

  // Sync with main collections reload on parent triggers
  useEffect(() => {
    if (userId) {
      loadCollections();
      loadData(books.length > 0);
    }
  }, [userId, importTrigger, loadData]);

  const displayReadingBooks = books.filter(b => b.progress > 0 && b.progress < 100);
  const unopenedBooks = books.filter(b => b.progress === 0);
  const completedCount = books.filter(b => b.progress === 100).length;

  if (loadingBooks || loadingCovers) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-on-surface-variant text-sm font-semibold">
        Loading desk...
      </div>
    );
  }

  return (
    <div className="p-margin-desktop space-y-12 max-w-container-max mx-auto w-full page-transition pb-24 text-on-surface">
      <HomeHeader booksCount={books.length} />

      <ActiveDesk 
        displayReadingBooks={displayReadingBooks} 
        covers={covers}
        onNavigateToBook={(id) => navigate(`/book/${id}`)}
        onNavigateToLibrary={() => navigate("/library")}
        onImport={handleImport}
        onImportFolder={handleImportFolder}
        hasAnyBooks={books.length > 0}
      />

      <HomeCollections 
        collections={collections}
        onSelectCollection={(colId) => setActiveCollectionId(colId)}
        onManageCollections={() => navigate("/collections")}
      />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ReadersJournal 
          recentAnnotations={recentAnnotations}
          onNavigateToBookDetails={(id) => navigate(`/book-details/${id}`)}
        />
        <LibraryOverview 
          booksCount={books.length}
          inProgressCount={displayReadingBooks.length}
          completedCount={completedCount}
          streakDays={streakDays}
          onConfigurePlans={() => navigate("/plans")}
        />
      </section>

      <ReadingQueue 
        unopenedBooks={unopenedBooks}
        covers={covers}
        onNavigateToBookDetails={(id) => navigate(`/book-details/${id}`)}
        onNavigateToBookReader={(id) => navigate(`/book/${id}`)}
        onImport={handleImport}
        onImportFolder={handleImportFolder}
        hasAnyBooks={books.length > 0}
      />

      <LibraryShelf 
        books={books}
        covers={covers}
        onNavigateToBookDetails={(id) => navigate(`/book-details/${id}`)}
        onNavigateToBookReader={(id) => navigate(`/book/${id}`)}
      />

      <CollectionDetailDrawer
        isOpen={activeCollectionId !== null}
        activeCollectionId={activeCollectionId}
        onClose={() => setActiveCollectionId(null)}
        displayCollection={displayCollection}
        displayColBooks={displayColBooks}
        covers={covers}
        books={books}
        onAssignBook={handleAssignBook}
        onRemoveBook={handleRemoveBookFromCollection}
        onDeleteCollection={handleDeleteCollection}
      />
    </div>
  );
};

export default HomePage;
