// src/components/BookComp/BookSynopsis.jsx
import React from "react";

export default function BookSynopsis({ synopsis }) {
  if (!synopsis) return null;

  return (
    <div className="mt-6 text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed max-h-40 md:max-h-52 overflow-y-auto pr-1">
      <h2 className="text-sm sm:text-base font-semibold text-white mb-2">
        Synopsis
      </h2>
      <p className="opacity-90">{synopsis}</p>
    </div>
  );
}
