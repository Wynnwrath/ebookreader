import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { tauriService } from "../services/tauriService";
import { BookDetails } from "../types";
import EpubReader from "../components/EpubReader";
import PdfReader from "../components/PdfReader";

interface BookOutletContext {
  userId: number | null;
}

interface BookPageProps {
  userId?: number | null;
}

const BookPage: React.FC<BookPageProps> = ({ userId: propUserId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const context = useOutletContext<BookOutletContext | null>();
  const userId = propUserId ?? context?.userId ?? 1;

  const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const details = await tauriService.getBookDetails(Number(id));
        if (!details) {
          setError("Book details not found in database.");
          return;
        }
        setBookDetails(details);
      } catch (err) {
        console.error("Failed to load book details:", err);
        setError("Failed to load book content. The file may be corrupt, missing, or in an unsupported format.");
      } finally {
        setLoading(false);
      }
    };

    loadBookDetails();
  }, [id]);

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#131411] text-[#e5e2dd] space-y-4 p-6 text-center">
        <FiX className="w-12 h-12 text-rose-500" />
        <h2 className="text-lg font-bold">Unable to Load Volume</h2>
        <p className="text-xs text-[#c5c6ca] max-w-md leading-relaxed">{error}</p>
        <button 
          onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:scale-[1.02] active:scale-[0.98] transition duration-200 cursor-pointer shadow-lg shadow-primary/20"
        >
          Return to Library
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#131411] text-[#e5e2dd] text-sm font-semibold animate-pulse">
        Loading e-book contents...
      </div>
    );
  }

  if (!bookDetails) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#131411] text-[#e5e2dd] space-y-4 p-6 text-center">
        <FiX className="w-12 h-12 text-rose-500" />
        <h2 className="text-lg font-bold">Unable to Load Volume</h2>
        <p className="text-xs text-[#c5c6ca] max-w-md leading-relaxed">No book details available.</p>
        <button 
          onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:scale-[1.02] active:scale-[0.98] transition duration-200 cursor-pointer shadow-lg shadow-primary/20"
        >
          Return to Library
        </button>
      </div>
    );
  }

  // Branch rendering based on book file type
  if (bookDetails.file_type === "pdf") {
    return <PdfReader bookDetails={bookDetails} userId={userId} />;
  }

  return <EpubReader bookDetails={bookDetails} userId={userId} />;
};

export default BookPage;
