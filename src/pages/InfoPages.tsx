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
