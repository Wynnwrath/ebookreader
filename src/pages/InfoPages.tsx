import React, { useState, useEffect } from "react";
import { 
  FiSettings, 
  FiHelpCircle, 
  FiRefreshCw, 
  FiChevronDown, 
  FiChevronUp,
  FiTerminal,
  FiSun,
  FiMoon,
  FiCoffee,
  FiMonitor
} from "react-icons/fi";

/* ==========================================================================
   SETTINGS PAGE
   ========================================================================== */
export const SettingsPage: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<string>("scholarly-dark");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [fontSizeSetting, setFontSizeSetting] = useState<string>("medium");
  const [enableShortcuts, setEnableShortcuts] = useState<boolean>(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("stellaron-theme") || "scholarly-dark";
    let normalized = "scholarly-dark";
    if (savedTheme.includes("light")) {
      normalized = "scholarly-light";
    } else if (savedTheme.includes("sepia")) {
      normalized = "scholarly-sepia";
    }
    setActiveTheme(normalized);
  }, []);

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
    localStorage.setItem("stellaron-theme", theme);
    const root = document.documentElement;
    root.classList.remove("theme-scholarly-dark", "theme-scholarly-light", "theme-scholarly-sepia", "dark", "light");
    root.classList.add(`theme-${theme}`);
    if (theme === "scholarly-dark") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  };

  const handleSyncMock = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert("Library synchronized successfully!");
    }, 1500);
  };

  const handleResetMock = () => {
    const confirm = window.confirm("Are you sure you want to clear your local database cache? This will reset all read progress.");
    if (confirm) {
      alert("Local data cleared!");
    }
  };

  return (
    <div className="space-y-6 w-full animate-pop-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FiSettings className="text-primary w-6 h-6" />
          <span>App Settings</span>
        </h1>
        <p className="text-xs text-text-dim mt-0.5">Customize global preferences for your Stellaron environment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Appearance Settings */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-dim flex items-center gap-2 border-b border-border/40 pb-2">
              Appearance
            </h2>
            
            {/* Active theme select */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-text">Color Theme</div>
                <div className="text-[10px] text-text-dim">Adjust the general interface coloring wrapper.</div>
              </div>
              
              <div className="flex bg-bg border border-border p-0.5 rounded-lg text-xs font-medium">
                {[
                  { id: "scholarly-dark", label: "Dark", icon: FiMoon },
                  { id: "scholarly-sepia", label: "Sepia", icon: FiCoffee },
                  { id: "scholarly-light", label: "Light", icon: FiSun }
                ].map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition ${
                      activeTheme === theme.id ? "bg-primary text-white" : "text-text-dim hover:text-text"
                    }`}
                  >
                    <theme.icon className="w-3.5 h-3.5" />
                    <span>{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reader Preferences Settings */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-dim flex items-center gap-2 border-b border-border/40 pb-2">
              Reader Config
            </h2>

            {/* Default font scale */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-text">Default Font Size</div>
                <div className="text-[10px] text-text-dim">Scale of texts loaded in reader views.</div>
              </div>
              <select
                value={fontSizeSetting}
                onChange={(e) => setFontSizeSetting(e.target.value)}
                className="bg-bg border border-border text-text rounded px-3 py-1.5 focus:outline-none focus:border-primary text-xs"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Shortcuts toggle */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                <div className="text-xs font-semibold text-text">Keyboard Shortcuts</div>
                <div className="text-[10px] text-text-dim">Enable left/right keys to turn pages.</div>
              </div>
              <button
                onClick={() => setEnableShortcuts(!enableShortcuts)}
                className={`w-10 h-5.5 rounded-full border border-border transition relative p-0.5 ${
                  enableShortcuts ? "bg-primary" : "bg-bg"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  enableShortcuts ? "translate-x-4.5" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Maintenance / Data Controls */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-dim flex items-center gap-2 border-b border-border/40 pb-2 text-red-500/90">
              Maintenance
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <div className="text-xs font-semibold text-text">Sync Library Database</div>
                <div className="text-[10px] text-text-dim">Forces a rescan of books inside the system directory.</div>
              </div>
              <button
                onClick={handleSyncMock}
                disabled={isSyncing}
                className="px-4 py-2 rounded-lg bg-primary hover:brightness-110 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <FiRefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync Collection"}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between pt-2">
              <div>
                <div className="text-xs font-semibold text-text">Reset Library Cache</div>
                <div className="text-[10px] text-text-dim">Clears indexed book histories and bookmark configurations.</div>
              </div>
              <button
                onClick={handleResetMock}
                className="px-4 py-2 rounded-lg bg-glass border border-red-500/30 text-red-500/90 hover:bg-red-500/10 text-xs font-semibold transition"
              >
                Wipe Cache
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ==========================================================================
   HELP PAGE
   ========================================================================== */
export const HelpPage: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(prev => (prev === index ? null : index));
  };

  const keyboardShortcuts = [
    { keys: ["Left Arrow", "A"], action: "Go to previous reading page" },
    { keys: ["Right Arrow", "D"], action: "Go to next reading page" },
    { keys: ["Escape"], action: "Exit active reader to Library" },
    { keys: ["B"], action: "Toggle bookmark on active page" },
    { keys: ["S"], action: "Open layout configuration panel" }
  ];

  const faqs = [
    {
      q: "How do I import books into Stellaron?",
      a: "Click on the 'Import EPUB' button in the dashboard. In a connected Tauri runtime, this opens your native file explorer where you can select any valid .epub book to add to your collection."
    },
    {
      q: "Where does the app save my reading progress?",
      a: "Your book annotations, bookmarks, and page progress are saved locally inside a SQLite database located in your OS application directory (under `src-tauri` directory)."
    },
    {
      q: "Can I customize the reader color schemes?",
      a: "Yes! While inside a book, click on the Settings (gear) icon in the top right header to toggle between Dark mode, Cream paper, and Sepia page styles."
    }
  ];

  return (
    <div className="space-y-6 w-full animate-pop-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FiHelpCircle className="text-primary w-6 h-6" />
          <span>Help & Documentation</span>
        </h1>
        <p className="text-xs text-text-dim mt-0.5">Find keyboard shortcut indexes and guides for the app.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keyboard Shortcuts Checklist */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-3 h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-dim flex items-center gap-2 border-b border-border/40 pb-2">
            <FiTerminal /> Keyboard Shortcuts
          </h2>
          
          <div className="space-y-2.5 pt-1">
            {keyboardShortcuts.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs border-b border-border/10 pb-2 last:border-b-0 last:pb-0">
                <span className="text-text-dim">{item.action}</span>
                <div className="flex gap-1">
                  {item.keys.map((key, keyIdx) => (
                    <kbd key={keyIdx} className="px-1.5 py-0.5 rounded bg-bg border border-border text-[10px] font-mono text-text font-bold shadow-inner">
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs Accordion Section */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-dim flex items-center gap-2 border-b border-border/40 pb-2">
            Frequently Asked Questions
          </h2>

          <div className="space-y-2.5 pt-1">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div key={idx} className="border border-border rounded-lg overflow-hidden bg-bg/30">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-text hover:bg-glass text-left"
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? <FiChevronUp className="w-4 h-4 text-primary" /> : <FiChevronDown className="w-4 h-4 text-text-dim" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 py-3 border-t border-border bg-bg/50 text-[11px] text-text-dim leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
