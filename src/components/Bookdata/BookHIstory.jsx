import React, { useEffect, useState } from "react";
import HistoryCard from "./HistoryCard";
import BookStackImg from "../../images/bookstack.png";
import Reading from "../../images/Reading.png";

{/* BookHistory Component to display reading statistics */}
export default function BookHistory() {
  const [stats, setStats] = useState({ completed: 0, reading: 0 });

  useEffect(() => {
    // 1. Get the raw list of books from the cache we created in LibraryPage
    const rawCache = localStorage.getItem("library_raw_cache");
    if (rawCache) {
      try {
        const books = JSON.parse(rawCache);
        let completedCount = 0;
        let readingCount = 0;

        // 2. Calculate stats based on saved progress
        books.forEach((b) => {
          const savedProgress = localStorage.getItem(`book_progress_${b.book_id}`);
          const progress = savedProgress ? parseFloat(savedProgress) : 0;

          if (progress >= 100) {
            completedCount++;
          } else if (progress > 0) {
            readingCount++;
          }
        });

        setStats({ completed: completedCount, reading: readingCount });
      } catch (e) {
        console.error("Failed to calculate book stats", e);
      }
    }
  }, []);

  return (
    // Added 'justify-center' to put it in the middle
    <div className="w-full flex gap-10 justify-center flex-wrap">
      <HistoryCard 
        image={BookStackImg} 
        value={stats.completed} 
        title={"Completed"} 
      />
      <HistoryCard 
        image={Reading} 
        value={stats.reading} 
        title={"Reading"} 
      />
    </div>
  );
}