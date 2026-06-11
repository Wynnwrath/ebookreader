import React from "react";
import { FiCalendar } from "react-icons/fi";

interface HomeHeaderProps {
  booksCount: number;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ booksCount }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-outline-variant/10 pb-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-on-surface tracking-tight">
          {getGreeting()}, <span className="text-tertiary font-display">Reader</span>
        </h1>
        <p className="font-sans text-sm text-on-surface-variant/80 mt-1.5">
          Welcome back to your reading desk. You have {booksCount} {booksCount === 1 ? "book" : "books"} in your private archive.
        </p>
      </div>
      
      {/* Date Display */}
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface-container-high/40 border border-outline-variant/15 text-xs font-semibold text-on-surface-variant shadow-sm">
        <FiCalendar className="w-4 h-4 text-tertiary" />
        <span>
          {new Date().toLocaleDateString(undefined, { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>
    </section>
  );
};

export default HomeHeader;
