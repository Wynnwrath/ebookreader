// src/components/Bookdata/BookList.jsx
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import BookCard from "./BookCard";

export default function BookList() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const data = await invoke("list_books"); // Tauri command
        // Map backend Books struct to BookCard props
        const mappedBooks = data.map((book) => ({
          id: book.book_id,
          title: book.title,
          coverImage: book.cover_image_path || "",
          type: book.file_type || "BOOK",
          filePath: book.file_path || "",
          author: "", // Optional: add if you have author data
        }));
        setBooks(mappedBooks);
      } catch (err) {
        console.error("Failed to fetch books:", err);
      }
    }

    fetchBooks();
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {books.map((book) => (
        <BookCard key={book.id} {...book} />
      ))}
    </div>
  );
}
