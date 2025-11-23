// src/components/FolderComp/FolderItem.jsx
import { FaFolder, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import GlassCard from "../../ui/GlassCard";
import BookCard from "../Bookdata/BookCard";

export default function FolderItem({ folder, index, toggleExpand }) {
  const navigate = useNavigate();

  const handleBookOpen = (book) => {
    const bookId = book.id ?? encodeURIComponent(book.title);
    navigate(`/book/${bookId}`, { state: { book } });
  };

  return (
    <GlassCard
      padding="p-4"
      rounded="rounded-2xl"
      className="bg-[var(--color-primary)] shadow-lg border border-[#ff8a00]/10"
    >
      {/* Header */}
      <div
        className="flex items-center cursor-pointer select-none"
        onClick={() => toggleExpand(index)}
      >
        <FaFolder className="text-yellow-400 mr-3" size={24} />

        <span className="text-lg font-semibold tracking-wide">
          {folder.name}
        </span>

        <div className="ml-auto">
          {folder.expanded ? (
            <FaChevronDown className="text-gray-400" />
          ) : (
            <FaChevronRight className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Books */}
      {folder.expanded && (
        <div className="flex flex-wrap gap-4 mt-4">
          {folder.books.length > 0 ? (
            folder.books.map((book, i) => (
              <BookCard
                key={book.id ?? i}
                id={book.id}
                title={book.title}
                author={book.author}
                coverImage={book.coverImage}
                type={book.type}
                filePath={book.filePath}
                onClick={handleBookOpen}
              />
            ))
          ) : (
            <p className="text-gray-400">No books found in this folder.</p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
