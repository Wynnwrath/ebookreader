// src/components/BookComp/BookRelated.jsx
import React from "react";
import BookCard from "../Bookdata/BookCard";

export default function BookRelated({ relatedBooks = [], onBookClick }) {
  if (!relatedBooks.length) return null;

  return (
    <div className="mt-6">
      <h2 className="text-sm sm:text-base font-semibold text-white mb-3">
        Related books
      </h2>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
        {relatedBooks.map((book, index) => (
          <div key={book.id ?? index} className="shrink-0">
            <BookCard
              id={book.id}
              title={book.title}
              author={book.author}
              coverImage={book.coverImage}
              type={book.type}
              filePath={book.filePath}
              onClick={onBookClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
