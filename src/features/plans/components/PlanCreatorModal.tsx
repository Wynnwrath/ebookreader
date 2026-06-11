import React, { useState } from "react";
import { Book } from "../../../types";

interface PlanCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbBooks: Book[];
  onSubmit: (
    title: string,
    desc: string,
    pages: number,
    duration: number,
    bookId: number | null
  ) => void;
}

export const PlanCreatorModal: React.FC<PlanCreatorModalProps> = ({
  isOpen,
  onClose,
  dbBooks,
  onSubmit,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPages, setNewPages] = useState(20);
  const [newDuration, setNewDuration] = useState(14);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onSubmit(newTitle, newDesc, newPages, newDuration, selectedBookId);
    
    // Reset form
    setNewTitle("");
    setNewDesc("");
    setNewPages(20);
    setNewDuration(14);
    setSelectedBookId(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-outline-variant/25 rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden relative p-8 flex flex-col gap-6 animate-zoom-in-modal text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
          <h2 className="text-2xl font-serif font-bold text-on-surface">Create Reading Plan</h2>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high p-1 rounded-full transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Plan Title</label>
            <input 
              type="text" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g., Classical Philosophy Track" 
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
            <textarea 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Summarize your goals..." 
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition h-20 resize-none"
            />
          </div>

          {/* Book Association Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Associate with Book</label>
            <select 
              value={selectedBookId === null ? "" : selectedBookId}
              onChange={e => setSelectedBookId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition cursor-pointer"
            >
              <option value="">-- No Book Associated (Manual Progress) --</option>
              {dbBooks.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.author})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pages / Day</label>
              <input 
                type="number" 
                value={newPages} 
                onChange={e => setNewPages(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Duration (Days)</label>
              <input 
                type="number" 
                value={newDuration} 
                onChange={e => setNewDuration(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-tertiary transition"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-4 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition shadow-sm font-bold text-xs cursor-pointer"
            >
              Create Plan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
