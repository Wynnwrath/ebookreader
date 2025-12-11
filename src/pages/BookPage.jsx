import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog"; // <--- Import Native Dialog
import BookHeader from "../components/BookComp/BookHeader";
import BookDetails from "../components/BookComp/BookDetails";
import { fetchCoverPage, getCoverURLSync } from "../components/Bookdata/fetchCoverPage"; 

export default function BookPage() {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const initialBook = location.state?.book ?? null;

  // Initialize coverSrc synchronously from cache if possible!
  const [coverSrc, setCoverSrc] = useState(() => {
    if (initialBook?.id) return getCoverURLSync(initialBook.id);
    if (id) return getCoverURLSync(id);
    return null;
  });

  const [book, setBook] = useState(initialBook);
  const [status, setStatus] = useState(initialBook ? "loaded" : "idle");
  const [error, setError] = useState(null);

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

        if (!coverSrc && mappedBook.id) {
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

    if (initialBook) {
      if (!coverSrc) {
        fetchCoverPage(initialBook.id).then(url => {
          if (mounted && url) setCoverSrc(url);
        });
      }
    } else if (id) {
      fetchBookMetadata(id);
    }

    return () => {
      mounted = false;
    };
  }, [id, initialBook]); 

  const handleBack = () => navigate(-1);

  // --- REMOVE BOOK LOGIC (FIXED) ---
  const handleRemoveBook = async () => {
    if (!book) return;

    // 1. Use Native Tauri Dialog (Blocks correctly and looks native)
    const confirmed = await ask(`Are you sure you want to permanently delete "${book.title}"?`, {
      title: 'Remove Book',
      kind: 'warning',
      okLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (!confirmed) return; // Stop if user clicks Cancel

    try {
      // 2. Call Backend
      const success = await invoke("remove_book", { bookId: book.id });
      
      if (success) {
        // 3. Clear from LocalStorage
        const cacheKey = `book_cover_${book.id}`;
        localStorage.removeItem(cacheKey);

        // 4. Navigate to Library
        alert(`Book "${book.title}" removed!`);
        navigate("/library"); // <--- Changed from "/" to "/library"
      } else {
        alert("Failed to remove book. Please try again.");
      }

    } catch (err) {
      console.error("Failed to delete book:", err);
      alert(`Error removing book: ${err}`);
    }
  };
  // -------------------------

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
      />
    );
  };

  return (
    <div className="px-4 py-6 md:px-10 md:py-10 lg:px-20 lg:py-10 rounded-2xl min-h-full">
      <BookHeader 
        onBack={handleBack} 
        onRemove={handleRemoveBook} 
      />
      {renderContent()}
    </div>
  );
}