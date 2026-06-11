import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  FiHome, 
  FiBookOpen, 
  FiSettings, 
  FiFolder, 
  FiPlus, 
  FiChevronDown, 
  FiChevronRight,
  FiUser,
  FiCalendar
} from "react-icons/fi";
import { Collection } from "../types";

interface RootSidebarProps {
  collections: Collection[];
  activeCollectionId: string | null;
  onSelectCollection: (colId: string) => void;
  onOpenImport: () => void;
  onOpenSettings: () => void;
}

const RootSidebar: React.FC<RootSidebarProps> = ({
  collections,
  activeCollectionId,
  onSelectCollection,
  onOpenImport,
  onOpenSettings,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollectionsExpanded, setIsCollectionsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem("stellaron-sidebar-collections-expanded");
    return saved === null ? true : saved === "true";
  });

  const handleSidebarCollectionClick = (colId: string) => {
    if (location.pathname !== "/" && location.pathname !== "/collections") {
      navigate("/collections");
    }
    onSelectCollection(colId);
  };

  const toggleCollectionsExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextVal = !isCollectionsExpanded;
    setIsCollectionsExpanded(nextVal);
    localStorage.setItem("stellaron-sidebar-collections-expanded", String(nextVal));
  };

  const getDotColorClass = (accentColor: string) => {
    if (accentColor.includes("emerald")) return "bg-emerald-500";
    if (accentColor.includes("amber")) return "bg-amber-500";
    if (accentColor.includes("orange")) return "bg-orange-500";
    if (accentColor.includes("blue")) return "bg-blue-500";
    if (accentColor.includes("indigo")) return "bg-indigo-500";
    if (accentColor.includes("slate")) return "bg-slate-500";
    if (accentColor.includes("tertiary")) return "bg-tertiary";
    if (accentColor.includes("secondary")) return "bg-secondary";
    if (accentColor.includes("primary")) return "bg-primary";
    return "bg-tertiary";
  };

  const navLinks = [
    { name: "Dashboard", path: "/", icon: FiHome },
    { name: "Catalog", path: "/library", icon: FiBookOpen },
    { name: "Collections", path: "/collections", icon: FiFolder },
    { name: "Profile", path: "/profile", icon: FiUser },
    { name: "Book Plans", path: "/plans", icon: FiCalendar },
  ];

  return (
    <aside className="w-[280px] bg-surface-container-low dark:bg-surface-container-lowest backdrop-blur-xl border-r border-outline-variant/20 shadow-sm flex flex-col py-8 px-6 gap-4 z-[60] hidden md:flex shrink-0">
      
      {/* Workspace Brand Header with Avatar (Clickable to User Profile) */}
      <div 
        onClick={() => navigate("/profile")}
        className="flex items-center gap-4 mb-6 px-2 hover:opacity-85 transition-opacity cursor-pointer group/brand"
      >
        <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0 border border-outline-variant/20 shadow-sm group-hover/brand:border-tertiary/50 transition-colors">
          <img 
            alt="User profile" 
            className="w-full h-full object-cover group-hover/brand:scale-105 transition-transform duration-300" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBveH3j_jLDZyg3rMUr2yCa7_K0L-tyGFZX_4vii0oKdzKquuj16Hfate6qfnChTH-GFBrWavsWF_-2WQO5MBEcOO5EO23UyHJaIx4EymeqhsS1KJnVRLDfugyg7zQASb4jqwcw5NRZO0h0IfZCUBWuT3MlC_o8eybfZgsXyILOMzm4gDjp8qYF6WEE9XuCzYmWW2TyMH6kzKXot9mZj4l0lrM0ka747PcJ7bd3xVGKx5lmkhmXFPvx9t_gV4HLdDFha2HnjCA98Cw"
          />
        </div>
        <div>
          <h1 className="font-headline-md text-[20px] font-bold text-on-surface leading-tight group-hover/brand:text-tertiary transition-colors">Stellaron</h1>
          <p className="font-label-sm text-[11px] text-on-surface-variant/75 uppercase tracking-widest leading-none mt-0.5">Private Archive</p>
        </div>
      </div>

      {/* Import Book CTA */}
      <button 
        onClick={onOpenImport}
        className="w-full bg-tertiary/15 text-tertiary border border-tertiary/30 hover:bg-tertiary/25 hover:border-tertiary transition-all duration-200 py-3 px-4 rounded-lg font-label-md text-label-md mb-4 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
      >
        <FiPlus className="w-4.5 h-4.5" />
        <span>Import Book</span>
      </button>

      {/* Sidebar Navigation */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <React.Fragment key={link.path}>
              <div className="relative flex items-center w-full">
                <Link
                  to={link.path}
                  className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg text-label-md transition-all duration-300 group ${
                    isActive 
                      ? "text-tertiary font-bold bg-surface-container dark:bg-surface-container-high/60 scale-98" 
                      : "text-on-surface-variant font-medium hover:bg-surface-container-high/40 hover:text-tertiary"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-tertiary" : "text-on-surface-variant/70 group-hover:text-tertiary"} transition-colors`} />
                    <span>{link.name}</span>
                  </div>
                  {link.name !== "Collections" && isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0" />
                  )}
                </Link>

                {link.name === "Collections" && collections.length > 0 && (
                  <button
                    onClick={toggleCollectionsExpanded}
                    className="absolute right-3 p-1.5 rounded hover:bg-surface-container-highest/60 text-on-surface-variant/75 hover:text-tertiary transition cursor-pointer z-10 flex items-center justify-center"
                    title={isCollectionsExpanded ? "Minimize Collections" : "Expand Collections"}
                  >
                    {isCollectionsExpanded ? (
                      <FiChevronDown className="w-4 h-4" />
                    ) : (
                      <FiChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {link.name === "Collections" && collections.length > 0 && isCollectionsExpanded && (
                <div className="pl-9 pr-2 py-1 flex flex-col gap-1 text-xs text-on-surface-variant/80 border-l border-outline-variant/10 ml-6 mt-1 mb-2 animate-fade-in">
                  {collections.map((col) => {
                    const isColActive = activeCollectionId === col.id;
                    return (
                      <button
                        key={col.id}
                        onClick={() => handleSidebarCollectionClick(col.id)}
                        className={`flex items-center gap-2.5 py-1.5 px-3 rounded hover:bg-surface-container-high/30 hover:text-tertiary transition text-left cursor-pointer font-sans ${
                          isColActive ? "text-tertiary font-bold bg-surface-container/40" : "text-on-surface-variant/70 font-medium"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColorClass(col.accentColor)}`} />
                        <span className="truncate text-[11px]">{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Settings Footer link */}
      <div className="mt-auto pt-4 border-t border-outline-variant/15">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high/40 hover:text-tertiary transition-colors cursor-pointer text-left"
        >
          <FiSettings className="w-5 h-5" />
          <span className="font-label-md">Settings</span>
        </button>
      </div>

    </aside>
  );
};

export default RootSidebar;
