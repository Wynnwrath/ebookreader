import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export interface PlainLayoutProps {
  userId?: number | null;
}

const PlainLayout: React.FC<PlainLayoutProps> = ({ userId }) => {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen bg-bg text-text flex flex-col overflow-y-auto custom-scrollbar">
      {/* Upper Navigation Header */}
      <header className="h-16 px-6 border-b border-border bg-header/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-glass border border-border text-text hover:bg-primary/20 hover:text-white transition duration-200"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <div className="text-sm font-semibold tracking-wide uppercase text-text-dim">
          System Preferences
        </div>
      </header>

      {/* Main content slot */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        <div className="animate-pop-in">
          <Outlet context={{ userId }} />
        </div>
      </main>
    </div>
  );
};

export default PlainLayout;
