import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import BookHeader from "../components/BookComp/BookHeader";
import BookDetails from "../components/BookComp/BookDetails";

export default function BookPage() {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const initialBook = location.state?.book ?? null;

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

        // Map Rust struct -> frontend BookDetails props
        const mappedBook = {
          id: metadata.book_id,
          title: metadata.title,
          author: "", 
          coverImage: metadata.cover_image_path || "",
          type: metadata.file_type || "BOOK",
          filePath: metadata.file_path || "",
          pages: 0, 
          synopsis: "", 
          relatedBooks: [], 
          addedAt: metadata.added_at || null,
          publishedYear: metadata.published_date || null,
          // more fields can be added as needed
        };

        setBook(mappedBook);
        setStatus("loaded");
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to fetch book metadata:", err);
        setError(err.message || "Failed to load book metadata.");
        setStatus("error");
      }
    }

    if (!initialBook && id) {
      fetchBookMetadata(id);
    }

    return () => {
      mounted = false;
    };
  }, [id, initialBook]);

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
