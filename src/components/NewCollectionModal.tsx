import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

const ACCENT_COLORS = [
  { name: "Sage Green", value: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { name: "Warm Amber", value: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { name: "Terracotta", value: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { name: "Muted Blue", value: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { name: "Deep Indigo", value: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  { name: "Classic Slate", value: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
];

const IMAGE_PRESETS = [
  { name: "Classic Library", value: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600" },
  { name: "Cosmic Nebula", value: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600" },
  { name: "Abstract Fluid", value: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600" },
  { name: "Vintage Paper", value: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600" },
  { name: "Minimalist Grid", value: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=600" },
];

interface NewCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCollection: (name: string, desc: string, color: string, image: string) => void;
}

const NewCollectionModal: React.FC<NewCollectionModalProps> = ({
  isOpen,
  onClose,
  onCreateCollection,
}) => {
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [newColColor, setNewColColor] = useState(ACCENT_COLORS[0].value);
  const [newColImage, setNewColImage] = useState(IMAGE_PRESETS[0].value);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    onCreateCollection(newColName, newColDesc, newColColor, newColImage);
    setNewColName("");
    setNewColDesc("");
    setNewColImage(IMAGE_PRESETS[0].value);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface-container border border-outline-variant/20 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-pop-in text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-headline-md font-bold text-on-surface">Create Collection</h3>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Philosophical Treatises"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-tertiary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
            <textarea
              placeholder="A brief commentary or theme statement..."
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              rows={3}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-tertiary resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Collection Backdrop Image</label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {IMAGE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setNewColImage(preset.value)}
                  className={`aspect-video rounded-lg overflow-hidden border cursor-pointer transition relative group/preset ${
                    newColImage === preset.value ? "ring-2 ring-tertiary ring-offset-2 ring-offset-surface-container-low" : "border-outline-variant/30 hover:border-outline-variant/60"
                  }`}
                  title={preset.name}
                >
                  <img src={preset.value} alt={preset.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preset:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">{preset.name.split(" ")[0]}</span>
                  </div>
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or paste custom image URL..."
              value={newColImage}
              onChange={(e) => setNewColImage(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-tertiary text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Color Accent</label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setNewColColor(col.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition ${col.value} ${
                    newColColor === col.value ? "ring-2 ring-tertiary ring-offset-2 ring-offset-surface-container-lowest" : "opacity-75 hover:opacity-100"
                  }`}
                >
                  {col.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant/20 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tertiary text-on-tertiary font-bold rounded-lg text-xs hover:bg-tertiary/90 transition shadow-sm"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default NewCollectionModal;
