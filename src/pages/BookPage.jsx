import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import BookHeader from "../components/BookComp/BookHeader";
import BookDetails from "../components/BookComp/BookDetails";
import { fetchCoverPage, getCoverURLSync } from "../components/Bookdata/fetchCoverPage"; 

export default function BookPage() {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const initialBook = location.state?.book ?? null;
  const preloadedCover = location.state?.preloadedCover ?? null;

  const [coverSrc, setCoverSrc] = useState(() => {
    if (preloadedCover) return preloadedCover;
    if (initialBook?.id) return getCoverURLSync(initialBook.id);
    if (id) return getCoverURLSync(id);
    return null;
  });

  const [book, setBook] = useState(initialBook);
  const [status, setStatus] = useState(initialBook ? "loaded" : "idle");
  const [error, setError] = useState(null);
  
  // New State for Progress
  const [currentProgress, setCurrentProgress] = useState(0);

  // Helper: Read progress from LocalStorage
  const loadProgress = useCallback((bookId) => {
    if (!bookId) return;
    const saved = localStorage.getItem(`book_progress_${bookId}`);
    if (saved) {
      setCurrentProgress(parseFloat(saved));
    } else {
      setCurrentProgress(0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchBookMetadata(bookId) {
      setStatus("loading");
      setError(null);
      try {
        const metadata = await invoke("fetch_metadata", { bookId: Number(bookId) });
        if (!mounted) return;

        if (!metadata) {
          setBook(null);
          setError("Book metadata not found.");
          setStatus("error");
          return;
        }

        const mappedBook = {
          id: metadata.book_id,
          title: metadata.title,
          author: metadata.author || "",
          coverImage: metadata.cover_image_path || "",
          type: metadata.file_type || "BOOK",
          filePath: metadata.file_path || "",
          pages: metadata.total_pages || 0,
          synopsis: metadata.description || "",
          relatedBooks: metadata.related_books || [],
          addedAt: metadata.added_at || null,
          publishedYear: metadata.published_date || null,
        };

        setBook(mappedBook);
        setStatus("loaded");

        // Load progress immediately
        loadProgress(mappedBook.id);

        if (mappedBook.id) {
            const url = await fetchCoverPage(mappedBook.id);
            if (mounted && url) setCoverSrc(url);
        }

      } catch (err) {
        if (!mounted) return;
        console.error("Failed to fetch book metadata:", err);
        setError(err.message || "Failed to load book metadata.");
        setStatus("error");
      }
    }

    if (!initialBook && id) {
      fetchBookMetadata(id);
    } else if (initialBook) {
      // Even if we have the book object, we must load the progress from storage
      loadProgress(initialBook.id);
      
      if (!coverSrc) {
        fetchCoverPage(initialBook.id).then(url => {
          if (mounted && url) setCoverSrc(url);
        });
      }
    }

    return () => { mounted = false; };
  }, [id, initialBook, loadProgress]); 

  const handleBack = () => navigate(-1);

  const handleRemoveBook = async () => {
    if (!book) return;
    const confirmed = await ask(`Are you sure you want to permanently delete "${book.title}"?`, {
      title: 'Remove Book',
      kind: 'warning',
      okLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const success = await invoke("remove_book", { bookId: book.id });
      if (success) {
        // Clear Cover
        localStorage.removeItem(`book_cover_${book.id}`);
        // Clear Progress
        localStorage.removeItem(`book_progress_${book.id}`);
        
        alert(`Book "${book.title}" removed!`);
        
        // ✅ FIX: Navigate back to wherever the user came from (Home, Library, etc.)
        // This mimics the behavior of the "Back" button
        navigate(-1); 
      } else {
        alert("Failed to remove book. Please try again.");
      }
    } catch (err) {
      console.error("Failed to delete book:", err);
      alert(`Error removing book: ${err}`);
    }
  };

  const handleRelatedBookClick = (relatedBook) => {
    const bookId = relatedBook.id ?? encodeURIComponent(relatedBook.title);
    navigate(`/book/${bookId}`, { state: { book: relatedBook } });
  };

  const renderContent = () => {
    if (status === "loading") return <p className="text-white">Loading book details...</p>;
    if (status === "error") return <p className="text-red-300">{error || "Unable to load book."}</p>;
    if (!book) return <p className="text-white">No book found.</p>;

    return (
      <BookDetails
        book={book}
        relatedBooks={book.relatedBooks || []}
        onRelatedBookClick={handleRelatedBookClick}
        coverSrc={coverSrc}
        // Pass the live progress
        progress={currentProgress} 
        // Pass function to refresh progress when reader closes
        onRefreshProgress={() => loadProgress(book.id)}
      />
    );
  };

  return (
    <div className="px-4 py-6 md:px-10 md:py-10 lg:px-20 lg:py-10 rounded-2xl min-h-full">
      <BookHeader onBack={handleBack} onRemove={handleRemoveBook} />
      {renderContent()}
    </div>
  );
}