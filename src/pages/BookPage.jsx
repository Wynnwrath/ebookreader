// src/pages/BookPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import BookHeader from "../components/BookComp/BookHeader";
import BookDetails from "../components/BookComp/BookDetails";
import { API_BASE_URL, fetchBook } from "../services/books";

export default function BookPage() {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const usingSampleData = !API_BASE_URL;

  // When navigating from the library we keep the book payload to avoid a redundant fetch.
  const [book, setBook] = useState(location.state?.book ?? null);
  const [status, setStatus] = useState(book ? "loaded" : "idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const providedBook = location.state?.book;

    async function loadBook() {
      if (providedBook) {
        // UI remains responsive with passed-in data while a backend refresh runs (if configured).
        setBook(providedBook);
        setStatus(API_BASE_URL ? "loading" : "loaded");

        if (!API_BASE_URL) {
          return;
        }
      } else {
        setStatus("loading");
      }

      setError(null);

      try {
        // Central entry point for backend integration—backend teams only need to update fetchBook.
        const fetchedBook = await fetchBook(id, { fallback: !providedBook });
        if (!isMounted) return;
        setBook(fetchedBook);
        setStatus("loaded");
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Unable to load book details");
        setStatus("error");
      }
    }

    loadBook();

    return () => {
      isMounted = false;
    };
  }, [id, location.state?.book]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleRelatedBookClick = (relatedBook) => {
    const bookId = relatedBook.id ?? encodeURIComponent(relatedBook.title);
    navigate(`/book/${bookId}`, {
      state: { book: relatedBook },
    });
  };

  const renderContent = () => {
    if (status === "loading") {
      return <p className="text-white">Loading book details...</p>;
    }

    if (status === "error") {
      return (
        <p className="text-red-300">
          {error || "Something went wrong while loading the book."}
        </p>
      );
    }

    if (!book) {
      return <p className="text-white">No book found.</p>;
    }

    return (
      <>
        {usingSampleData && (
          <div className="mb-4 rounded-lg border border-amber-300/50 bg-amber-100/10 px-4 py-3 text-sm text-amber-200">
            Showing sample book details because no API base URL is configured yet.
          </div>
        )}
        <BookDetails
          book={book}
          relatedBooks={book.relatedBooks || []}
          onRelatedBookClick={handleRelatedBookClick}
        />
      </>
    );
  };

  return (
    <div className="px-4 py-6 md:px-10 md:py-10 lg:px-20 lg:py-10 rounded-2xl min-h-full">
      <BookHeader onBack={handleBack} />
      {renderContent()}
    </div>
  );
}