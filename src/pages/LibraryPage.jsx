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
    setLoading(true);
    setError(null);
    try {
      const raw = await invoke("list_books");
      setBooks(mapBooks(raw));
    } catch (err) {
      console.error("list_books failed:", err);
      setError("Failed to load books from backend.");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // IMPORT: files
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
        try {
          await invoke("import_book", { path });
        } catch (err) {
          console.error("import_book failed for", path, err);
        }
      }

      await fetchBooks();
    } catch (err) {
      console.error("File picker cancelled or failed:", err);
    } finally {
      setImporting(false);
    }
  };

  // IMPORT: directory
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
      console.error("Folder import failed:", err);
      setError("Folder import failed. See console for details.");
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
            className="px-3 py-2 rounded bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import File(s)"}
          </button>

          <button
            onClick={handleImportFolder}
            disabled={importing}
            className="px-3 py-2 rounded bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import Folder"}
          </button>

          <button
            onClick={fetchBooks}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-300">Loading books…</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : books.length === 0 ? (
        <p className="text-gray-400">No books yet. Use Import File(s) or Import Folder to add books.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map((b) => (
            <BookCard key={b.id} {...b} />
          ))}
        </div>
      )}
    </div>
  );
}