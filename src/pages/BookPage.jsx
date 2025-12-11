import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
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

        // If we didn't have the cover initially, try fetching it now
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
      // Even if we have the book, if coverSrc was null (cache miss), try fetching async
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
      // Note: We don't revokeObjectURL here because we might have generated it 
      // synchronously. Revoking it might break if we navigate back/forth quickly.
      // Let the browser garbage collect or handle cleanup more carefully if memory is an issue.
    };
  }, [id, initialBook]); // Removing coverSrc from dependency to avoid loops

  const handleBack = () => navigate(-1);

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
      <BookHeader onBack={handleBack} />
      {renderContent()}
    </div>
  );
}