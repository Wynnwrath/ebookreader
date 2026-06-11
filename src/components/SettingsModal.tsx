import React, { useState, useEffect } from "react";
import { 
  FiX, 
  FiSettings, 
  FiSliders, 
  FiSun, 
  FiMoon, 
  FiCoffee, 
  FiRefreshCw, 
  FiRotateCcw,
  FiBookOpen,
  FiType
} from "react-icons/fi";
import Button from "./ui/Button";
import { useTheme } from "../hooks/useTheme";
import { useReaderSettings } from "../hooks/useReaderSettings";

interface ReaderSettings {
  fontSize: number;
  setFontSize: (s: number) => void;
  lineHeight: number;
  setLineHeight: (l: number) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  readerTheme: string;
  setReaderTheme: (t: string) => void;
  readerLayoutMode: "classic" | "redesign";
  setReaderLayoutMode: (m: "classic" | "redesign") => void;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "general" | "reader";
  readerSettings?: ReaderSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = "general",
  readerSettings 
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "reader">(initialTab);
  
  // General settings local state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [enableShortcuts, setEnableShortcuts] = useState<boolean>(true);

  // Custom Hooks
  const { activeTheme, setTheme: handleThemeChange } = useTheme();
  const localSettings = useReaderSettings();

  // Load configuration from localStorage
  useEffect(() => {
    if (!isOpen) return;

    // Active tab default
    setActiveTab(initialTab);

    // Shortcuts
    const savedShortcuts = localStorage.getItem("stellaron-enable-shortcuts");
    setEnableShortcuts(savedShortcuts === null ? true : savedShortcuts === "true");
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Syncing Handler
  const handleSyncMock = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert("Library synchronized successfully!");
    }, 1200);
  };

  // Wipe Cache Handler
  const handleResetMock = () => {
    const confirm = window.confirm("Are you sure you want to clear your local database cache? This will reset all read progress.");
    if (confirm) {
      alert("Local cache reset successfully!");
    }
  };

  // Toggle Keyboard Shortcuts
  const handleToggleShortcuts = () => {
    const nextVal = !enableShortcuts;
    setEnableShortcuts(nextVal);
    localStorage.setItem("stellaron-enable-shortcuts", String(nextVal));
  };

  // Reader Settings getters
  const currentFontSize = readerSettings ? readerSettings.fontSize : localSettings.fontSize;
  const currentLineHeight = readerSettings ? readerSettings.lineHeight : localSettings.lineHeight;
  const currentFontFamily = readerSettings ? readerSettings.fontFamily : localSettings.fontFamily;
  const currentReaderTheme = readerSettings ? readerSettings.readerTheme : localSettings.readerTheme;
  const currentReaderLayout = readerSettings ? readerSettings.readerLayoutMode : localSettings.layoutMode;

  // Reader Settings setters
  const setFontSize = (size: number) => {
    if (readerSettings) readerSettings.setFontSize(size);
    else localSettings.setFontSize(size);
  };
  const setLineHeight = (height: number) => {
    if (readerSettings) readerSettings.setLineHeight(height);
    else localSettings.setLineHeight(height);
  };
  const setFontFamily = (family: string) => {
    if (readerSettings) readerSettings.setFontFamily(family);
    else localSettings.setFontFamily(family);
  };
  const setReaderTheme = (theme: string) => {
    if (readerSettings) readerSettings.setReaderTheme(theme);
    else localSettings.setReaderTheme(theme);
  };
  const setReaderLayout = (mode: "classic" | "redesign") => {
    if (readerSettings) readerSettings.setReaderLayoutMode(mode);
    else localSettings.setLayoutMode(mode);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-surface-container border border-outline-variant/20 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container/60 shrink-0">
          <div className="flex items-center gap-2 text-on-surface">
            <FiSettings className="w-5 h-5 text-tertiary" />
            <h3 className="font-display font-bold text-base">Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex flex-1 min-h-0">
          {/* Tab Selection Sidebar */}
          <aside className="w-1/3 border-r border-outline-variant/15 p-4 flex flex-col gap-1.5 bg-surface-container-low shrink-0">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "general"
                  ? "bg-tertiary/10 text-tertiary"
                  : "text-on-surface-variant hover:bg-surface-container-high/40 hover:text-on-surface"
              }`}
            >
              <FiSliders className="w-4 h-4" />
              <span>General Settings</span>
            </button>
            <button
              onClick={() => setActiveTab("reader")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "reader"
                  ? "bg-tertiary/10 text-tertiary"
                  : "text-on-surface-variant hover:bg-surface-container-high/40 hover:text-on-surface"
              }`}
            >
              <FiBookOpen className="w-4 h-4" />
              <span>Reader Config</span>
            </button>
          </aside>

          {/* Active Tab Panel */}
          <main className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-6 text-on-surface">
            {activeTab === "general" ? (
              <div className="space-y-6">
                {/* 1. App Theme Selection */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">App Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "scholarly-dark", label: "Dark", style: "bg-zinc-900 text-slate-100 border-zinc-700" },
                      { id: "scholarly-sepia", label: "Sepia", style: "bg-[#f4ecd8] text-[#5b4636] border-[#dfd5bc]" },
                      { id: "scholarly-light", label: "Light", style: "bg-[#fcf8f2] text-zinc-800 border-zinc-300" }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border flex flex-col items-center gap-1.5 transition cursor-pointer ${theme.style} ${
                          activeTheme === theme.id ? "ring-2 ring-tertiary" : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        {theme.id === "scholarly-dark" ? <FiMoon /> : theme.id === "scholarly-sepia" ? <FiCoffee /> : <FiSun />}
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Keyboard Shortcuts Toggle */}
                <div className="flex items-center justify-between py-3 border-t border-outline-variant/10">
                  <div>
                    <div className="text-xs font-bold">Keyboard Shortcuts</div>
                    <div className="text-[10px] text-on-surface-variant">Enable left/right/up/down keys to turn or scroll pages.</div>
                  </div>
                  <button
                    onClick={handleToggleShortcuts}
                    className={`w-10 h-5.5 rounded-full border border-outline-variant/30 transition relative p-0.5 ${
                      enableShortcuts ? "bg-tertiary" : "bg-surface-container-high"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      enableShortcuts ? "translate-x-4.5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* 3. Maintenance */}
                <div className="space-y-3 pt-3 border-t border-outline-variant/10">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Maintenance</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold">Sync Library Database</div>
                        <div className="text-[10px] text-on-surface-variant">Forces a scan of books inside the system directory.</div>
                      </div>
                      <button
                        onClick={handleSyncMock}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-lg bg-tertiary text-surface-container-lowest text-xs font-bold shadow flex items-center gap-1.5 hover:brightness-110 transition disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>{isSyncing ? "Syncing..." : "Sync"}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div>
                        <div className="text-xs font-bold">Reset Library Cache</div>
                        <div className="text-[10px] text-on-surface-variant">Clears indexed book histories and bookmark configurations.</div>
                      </div>
                      <button
                        onClick={handleResetMock}
                        className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        Wipe Cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Ebook Reading Mode */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Reader View Mode</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    {[
                      { id: "redesign", label: "Paginated Mode" },
                      { id: "classic", label: "Scrollable Mode" }
                    ].map(layout => (
                      <button
                        key={layout.id}
                        onClick={() => setReaderLayout(layout.id as "classic" | "redesign")}
                        className={`py-2 px-3 rounded-lg border text-center transition cursor-pointer ${
                          currentReaderLayout === layout.id
                            ? "bg-tertiary text-surface-container-lowest"
                            : "bg-surface border-outline-variant/20 hover:bg-surface-container-high"
                        }`}
                      >
                        {layout.label}
                      </button>
                    ))}
                  </div>
                </div>
 
                {/* 2. Reading Page Styles */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Reader Canvas Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "dark", label: "Dark Canvas", style: "bg-zinc-900 text-slate-100 border-zinc-700" },
                      { id: "cream", label: "Cream Paper", style: "bg-[#fcf8f2] text-[#2c2015] border-[#f0e3ce]" },
                      { id: "sepia", label: "Sepia Style", style: "bg-[#f4ecd8] text-[#5b4636] border-[#dfd5bc]" }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setReaderTheme(mode.id)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${mode.style} ${
                          currentReaderTheme === mode.id ? "ring-2 ring-tertiary" : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
 
                {/* 3. Fonts */}
                <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                  {/* Font Family selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Font Family</label>
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                      {[
                        { id: "font-serif", label: "Serif" },
                        { id: "font-sans", label: "Sans-Serif" },
                        { id: "font-mono", label: "Monospace" }
                      ].map(font => (
                        <button
                          key={font.id}
                          onClick={() => setFontFamily(font.id)}
                          className={`py-1.5 rounded-lg border text-center transition cursor-pointer ${
                            currentFontFamily === font.id
                              ? "bg-tertiary text-surface-container-lowest font-bold"
                              : "bg-surface border-outline-variant/20 hover:bg-surface-container-high"
                          }`}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>
 
                  {/* Font Size & Spacing Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Font Size</label>
                      <div className="flex bg-surface border border-outline-variant/20 rounded-lg p-0.5 items-center justify-between">
                        <button 
                          onClick={() => setFontSize(Math.max(12, currentFontSize - 1))}
                          className="w-8 h-8 rounded-md text-xs font-bold hover:bg-surface-container-high flex items-center justify-center cursor-pointer"
                        >
                          A-
                        </button>
                        <span className="text-xs font-bold px-2">{currentFontSize}px</span>
                        <button 
                          onClick={() => setFontSize(Math.min(32, currentFontSize + 1))}
                          className="w-8 h-8 rounded-md text-xs font-bold hover:bg-surface-container-high flex items-center justify-center cursor-pointer"
                        >
                          A+
                        </button>
                      </div>
                    </div>
 
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Line Spacing</label>
                      <div className="flex bg-surface border border-outline-variant/20 rounded-lg p-0.5 text-xs font-semibold">
                        {[
                          { value: 1.4, label: "Tight" },
                          { value: 1.6, label: "Normal" },
                          { value: 1.8, label: "Loose" }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setLineHeight(opt.value)}
                            className={`flex-1 py-1.5 rounded-md transition cursor-pointer text-center ${
                              currentLineHeight === opt.value ? "bg-tertiary text-surface-container-lowest font-bold" : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Reset Buttons */}
                <div className="pt-4 border-t border-outline-variant/10 flex justify-end">
                  <button
                    onClick={() => {
                      if (readerSettings) {
                        readerSettings.setFontSize(18);
                        readerSettings.setLineHeight(1.6);
                        readerSettings.setFontFamily("font-serif");
                        readerSettings.setReaderTheme("dark");
                        readerSettings.setReaderLayoutMode("redesign");
                      } else {
                        localSettings.resetAll();
                      }
                    }}
                    className="text-[10px] text-tertiary flex items-center gap-1 hover:underline cursor-pointer font-bold"
                  >
                    <FiRotateCcw className="w-3 h-3" />
                    <span>Reset Reader Formatting</span>
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Modal Footer */}
        <footer className="px-6 py-4 border-t border-outline-variant/15 flex justify-end bg-surface-container/60 shrink-0">
          <Button 
            variant="primary" 
            onClick={onClose}
            className="px-6 cursor-pointer"
          >
            Done
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
