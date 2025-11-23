// src/components/BookComp/BookDetails.jsx
import { useState } from "react";
import { FaHeart } from "react-icons/fa";
import GlassCard from "../../ui/GlassCard";
import StarRate from "../../assets/StarRate";
import BookSynopsis from "./BookSynopsis";
import BookMeta from "./BookMeta";
import BookAuthor from "./BookAuthor";
import BookRelated from "./BookRelated";

export default function BookDetails({
  book,
  relatedBooks = [],
  onRelatedBookClick,
}) {
  const [imageError, setImageError] = useState(false);

  const hasImage = book.coverImage && !imageError;
  const synopsis = book.synopsis || book.description;

  return (
    <GlassCard className="flex flex-col md:flex-row gap-4 lg:gap-8 p-4 md:p-6 mt-4 items-start">
      {/* COVER AREA */}
        <div className="w-full md:w-1/4 flex justify-center items-center">
        {hasImage ? (
            <img
            src={book.coverImage}
            alt={book.title}
            className="rounded-xl shadow-lg w-40 sm:w-44 md:w-52 lg:w-56 aspect-[3/4] object-cover"
            onError={() => setImageError(true)}
            />
        ) : (
            <div
            className="
                rounded-xl shadow-lg 
                w-40 sm:w-44 md:w-52 lg:w-60
                aspect-[3/4]
                bg-white/10 border border-white/20 
                flex items-center justify-center
                text-center px-4 
                text-xs sm:text-sm md:text-base text-white font-semibold
            "
            >
            {book.title}
            </div>
        )}
        </div>

      {/* DETAILS AREA */}
      <div className="flex flex-col justify-start md:w-3/4 text-white">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
          {book.title}
        </h1>

        {/* Author */}
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mt-2">
          {book.author || "Unknown"}
        </p>

        {/* Genres / Tags */}
        {book.tags && book.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 text-xs sm:text-sm text-gray-300">
            {book.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/10 rounded-full border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Star rating directly below genres */}
        <div className="mt-3">
          <StarRate rating={book.rating ?? 0} size={22} />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button className="px-5 sm:px-6 py-2 rounded-full bg-orange-500 hover:bg-orange-600 transition text-white text-sm sm:text-base font-semibold shadow-md">
              START READING
            </button>

            <button className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition border border-white/20 flex items-center gap-2 text-xs sm:text-sm">
              <span>📚</span>
              <span>Add to Library</span>
            </button>
          </div>

          <button className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition border border-white/20 flex items-center gap-2 text-xs sm:text-sm md:ml-auto">
            <FaHeart className="text-red-400" />
            <span>Add to Favorites</span>
          </button>
        </div>

        <BookSynopsis synopsis={synopsis} />
        <BookMeta book={book} />
        <BookAuthor author={book.author} bio={book.authorBio} />
        <BookRelated
          relatedBooks={relatedBooks}
          onBookClick={onRelatedBookClick}
        />
      </div>
    </GlassCard>
  );
}
