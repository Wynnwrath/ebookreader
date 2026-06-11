import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import SettingsModal from "../components/SettingsModal";
import ImportModal from "../components/ImportModal";
import RootSidebar from "../components/RootSidebar";
import SearchLibrary from "../components/SearchLibrary";
import { 
  FiSun, 
  FiMoon, 
  FiCoffee,
  FiZap,
  FiBell
} from "react-icons/fi";
import { useTheme } from "../hooks/useTheme";
import { useCollections } from "../hooks/useCollections";
import { AppOutletContext } from "../types";

export interface RootLayoutProps {
  userId?: number | null;
}

const RootLayout: React.FC<RootLayoutProps> = ({ userId }) => {
  const currentUserId = userId ?? 1;
  const location = useLocation();
  const navigate = useNavigate();

  // Custom Hooks
  const { activeTheme, toggleTheme } = useTheme();
  const { 
    collections, 
    activeCollectionId, 
    setActiveCollectionId, 
    loadCollections,
    setCollections 
  } = useCollections(currentUserId);

  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [importTrigger, setImportTrigger] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Deep linking or cross-page state loading
  useEffect(() => {
    if (location.state?.activeCollectionId) {
      setActiveCollectionId(location.state.activeCollectionId);
      window.history.replaceState({}, document.title);
    }
  }, [location, setActiveCollectionId]);

  return (
    <div className="w-screen h-screen flex bg-bg text-on-surface overflow-hidden select-none">
      
      {/* 1. SIDEBAR SUB-COMPONENT */}
      <RootSidebar 
        collections={collections}
        activeCollectionId={activeCollectionId}
        onSelectCollection={(colId) => setActiveCollectionId(colId)}
        onOpenImport={() => setShowImportModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* 2. MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Panel */}
        <header className="h-16 px-margin-desktop border-b border-outline-variant/10 bg-surface-container/60 dark:bg-surface-container-lowest/60 backdrop-blur-xl flex items-center justify-between shadow-sm shrink-0 z-30">
          
          {/* Search Library Input + Suggestions Dropdown */}
          <SearchLibrary 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNavigateToBook={(bookId) => navigate(`/book-details/${bookId}`)}
          />

          {/* Right Header Controls (Streak, Notifications, Theme) */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Streak Badge */}
            <div className="flex items-center gap-2 text-tertiary font-label-md text-[13px] bg-tertiary/10 border border-tertiary/20 px-3.5 py-1.5 rounded-full shadow-sm">
              <FiZap className="w-4 h-4 text-tertiary fill-current" />
              <span className="font-semibold">14 Day Streak</span>
            </div>

            {/* Theme & Notifications */}
            <div className="flex items-center gap-2 text-on-surface-variant">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-surface-container-high hover:text-tertiary transition-colors cursor-pointer relative"
                title={
                  activeTheme === "scholarly-dark"
                    ? "Switch to Sepia Theme"
                    : activeTheme === "scholarly-sepia"
                    ? "Switch to Light Theme"
                    : "Switch to Dark Theme"
                }
              >
                {activeTheme === "scholarly-light" ? (
                  <FiSun className="w-5 h-5 text-tertiary" />
                ) : activeTheme === "scholarly-sepia" ? (
                  <FiCoffee className="w-5 h-5 text-primary" />
                ) : (
                  <FiMoon className="w-5 h-5 text-on-surface-variant" />
                )}
              </button>

              <button className="p-2 rounded-full hover:bg-surface-container-high hover:text-tertiary transition-colors">
                <FiBell className="w-5 h-5 block" />
              </button>
            </div>
          </div>

        </header>

        {/* Dynamic Inner Page viewport */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-bg relative">
          <Outlet context={{ 
            searchQuery, 
            setSearchQuery, 
            userId: currentUserId, 
            importTrigger, 
            collections, 
            setCollections, 
            activeCollectionId, 
            setActiveCollectionId,
            loadCollections 
          } satisfies AppOutletContext} />
        </main>

      </div>

      {/* IMPORT LIBRARY MODAL OVERLAY */}
      <ImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        userId={currentUserId}
        onImportSuccess={() => setImportTrigger(prev => prev + 1)}
      />

      {/* SETTINGS MODAL OVERLAY */}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </div>
  );
};

export default RootLayout;
