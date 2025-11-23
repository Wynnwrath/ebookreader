// src/components/BookComp/BookMeta.jsx
import React from "react";
import { FaFileAlt, FaFolderOpen, FaRulerVertical, FaGlobe } from "react-icons/fa";

export default function BookMeta({ book }) {
  const format = book.type || "Unknown";
  const size = book.size || "Unknown size";
  const pages = book.pages || "N/A";
  const language = book.language || "Unknown";
  const year = book.publishedYear || "Unknown";
  const path = book.filePath || "No file path available";

  return (
    <div className="mt-6 text-xs sm:text-sm md:text-base text-gray-200">
      <h2 className="text-sm sm:text-base font-semibold text-white mb-3">
        About this book
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-white/5 rounded-xl px-3 py-3 sm:px-4 sm:py-4 border border-white/10">
        <div className="flex items-center gap-2">
          <FaFileAlt className="text-orange-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              Format
            </span>
            <span className="font-medium text-white">{format}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaFolderOpen className="text-blue-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              File Size
            </span>
            <span className="font-medium text-white">{size}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaRulerVertical className="text-green-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              Pages
            </span>
            <span className="font-medium text-white">{pages}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaGlobe className="text-purple-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              Language
            </span>
            <span className="font-medium text-white">{language}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaFileAlt className="text-teal-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              Published
            </span>
            <span className="font-medium text-white">{year}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 sm:col-span-2 lg:col-span-3">
          <FaFolderOpen className="mt-[2px] text-yellow-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] sm:text-xs uppercase tracking-wide text-gray-400">
              File Path
            </span>
            <span className="font-mono text-[0.7rem] sm:text-xs break-all text-gray-200/90">
              {path}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
