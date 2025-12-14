// src/layout/PlainLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function PlainLayout() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        grid h-screen
        [grid-template-areas:'sidebar_main']
        ${isExpanded ? "grid-cols-[250px_1fr]" : "grid-cols-[70px_1fr]"}
        transition-all duration-300
      `}
    >
      {/* Sidebar (Left column) */}
      <div className="[grid-area:sidebar]">
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </div>

      {/* Main content (Right side) */}
      <main 
      className="[grid-area:main] bg-gray-200p-6 overflow-auto"
      >
        <Outlet />
      </main>
    </div>
  );
}
