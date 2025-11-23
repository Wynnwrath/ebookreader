import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/SideBar";
import Header from "../components/HeaderComp/Header";
import stellarbg from "../assets/images/stellarbg.gif"; 

export default function RootLayout() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        grid h-screen
        grid-rows-[90px_1fr]
        [grid-template-areas:'sidebar_header''sidebar_main']

        sm:grid-rows-[30px_1fr]
        sm:[grid-template-areas:'sidebar_header''sidebar_main']

        max-sm:grid-cols-1
        max-sm:grid-rows-[90px_1fr_auto]
        max-sm:[grid-template-areas:'header''main''sidebar']

        transition-all duration-300
        ${isExpanded ? "grid-cols-[250px_1fr]" : "grid-cols-[70px_1fr]"}
        bg-cover bg-center bg-no-repeat
      `}
      style={{
        backgroundImage: `url(${stellarbg})`,
      }}
    >
      {/* Header */}
      <div className="[grid-area:header] pb-0 z-50">
        <Header />
      </div>

      {/* Sidebar */}
      <div className="[grid-area:sidebar]">
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </div>

      {/* Main Content */}
      <main
        className="
          [grid-area:main]
          bg-transparent
          m-4 p-6
          overflow-auto
          text-white
          no-scrollbar
        "
      >
        <Outlet />
      </main>
    </div>
  );
}
