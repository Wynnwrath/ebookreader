import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import BookCard from "../components/Bookdata/BookCard";
import { useNavigate } from "react-router-dom";

export default function LibraryPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const mapBooks = (raw) =>
    Array.isArray(raw)
      ? raw.map((b) => ({
          id: b.book_id,
          title: b.title || "Untitled Book",
          coverImage: b.cover_image_path || "",
          type: b.file_type || "BOOK",
          filePath: b.file_path || "",
          author: b.author || "",
        }))
      : [];

  const fetchBooks = async () => {
    setError(null);
    try {
      const raw = await invoke("list_books");
      const mapped = mapBooks(raw);
      setBooks(mapped);
      localStorage.setItem("library_books_cache", JSON.stringify(mapped));
    } catch (err) {
      console.error("list_books failed:", err);
      setError("Failed to load books from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem("library_books_cache");
    if (cached) {
      try {
        setBooks(JSON.parse(cached));
        setLoading(false); 
      } catch (e) {
        console.error("Failed to parse library cache", e);
      }
    }
    fetchBooks();
  }, []);

  const handleImportFiles = async () => {
    try {
      setImporting(true);
      const selected = await open({
        directory: false,
        multiple: true,
        filters: [{ name: "Books", extensions: ["pdf", "epub"] }],
      });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      for (const path of paths) {
        try { await invoke("import_book", { path }); } catch (err) { console.error(err); }
      }
      await fetchBooks();
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleImportFolder = async () => {
    try {
      setImporting(true);
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: "Select folder to import books from",
      });
      if (!selectedPath) return;
      await invoke("scan_books_directory", { directoryPath: selectedPath });
      await fetchBooks();
    } catch (err) {
      console.error(err);
      setError("Folder import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Library</h1>

        <div className="flex gap-2">
          <button
            onClick={handleImportFiles}
            disabled={importing}
            className="px-3 py-2 rounded bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {importing ? "Importing..." : "Import File(s)"}
          </button>

          <button
            onClick={handleImportFolder}
            disabled={importing}
            className="px-3 py-2 rounded bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {importing ? "Importing..." : "Import Folder"}
          </button>

          <button
            onClick={() => { setLoading(true); fetchBooks(); }}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
           <p className="text-gray-400 animate-pulse">Loading library...</p>
        </div>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-lg mb-2">Your library is empty.</p>
          <p className="text-sm">Use the buttons above to add your first book.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 lg:gap-10 pb-20">
          {books.map((b, index) => (
            // --- ANIMATION WRAPPER ---
            <div
              key={b.id}
              className="animate-pop-in flex justify-center"
              style={{
                opacity: 0, // Start invisible
                animationFillMode: 'forwards',
                animationDuration: '0.4s',
                animationDelay: `${index * 50}ms` // Stagger: 50ms per item
              }}
            >
              <BookCard {...b} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}