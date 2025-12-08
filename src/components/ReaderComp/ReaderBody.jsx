// src/components/Reader/ReaderBody.jsx

export default function ReaderBody({ content }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 text-gray-100 text-sm sm:text-base whitespace-pre-wrap">
      {content}
    </div>
  );
}
