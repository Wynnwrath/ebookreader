
import React from "react";

export default function BookAuthor({ author, bio }) {
  if (!author && !bio) return null;

  return (
    <div className="mt-6 text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed">
      <h2 className="text-sm sm:text-base font-semibold text-white mb-2">
        About the author
      </h2>

      {author && (
        <p className="font-semibold text-white mb-1 text-sm sm:text-base">
          {author}
        </p>
      )}

      {bio && <p className="opacity-90">{bio}</p>}
    </div>
  );
}
