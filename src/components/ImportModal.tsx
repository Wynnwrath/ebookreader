import React, { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { 
  FiX, 
  FiUploadCloud, 
  FiTag, 
  FiClock, 
  FiFileText 
} from "react-icons/fi";
import { tauriService } from "../services/tauriService";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  onImportSuccess: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  userId,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<{ name: string; path: string } | null>(null);
  const [selectedTag, setSelectedTag] = useState("Reference");
  const [customTags, setCustomTags] = useState<string[]>(["Fiction", "Non-Fiction", "Reference", "Textbook"]);
  const [recentImports, setRecentImports] = useState<Array<{ name: string; time: string; tag: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(`stellaron-recent-imports-${userId}`);
      if (saved) {
        setRecentImports(JSON.parse(saved));
      } else {
        setRecentImports([
          { name: "The Design of Everyday Things.epub", time: "Added 2 hours ago", tag: "Design" },
          { name: "Typography_Guidelines_v2.pdf", time: "Added yesterday", tag: "Reference" }
        ]);
      }
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleFileBrowse = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Ebook / Document", extensions: ["epub", "pdf"] }]
      });
      if (selected && typeof selected === "string") {
        const fileName = selected.split(/[\\/]/).pop() || "Unknown Ebook";
        setSelectedFile({ name: fileName, path: selected });
      }
    } catch (err) {
      console.error("Failed to select file:", err);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    try {
      await tauriService.importBook(selectedFile.path);
      
      const newImport = { 
        name: selectedFile.name, 
        time: "Added just now", 
        tag: selectedTag 
      };
      const updated = [newImport, ...recentImports].slice(0, 10);
      setRecentImports(updated);
      localStorage.setItem(`stellaron-recent-imports-${userId}`, JSON.stringify(updated));
      
      onImportSuccess();
      onClose();
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to import book:", err);
      alert("Failed to import book. Please make sure it is a valid EPUB file.");
    }
  };

  const handleAddNewTag = () => {
    const tagName = prompt("Enter new tag name:");
    if (tagName && tagName.trim()) {
      const trimmed = tagName.trim();
      if (!customTags.includes(trimmed)) {
        setCustomTags(prev => [...prev, trimmed]);
        setSelectedTag(trimmed);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={() => {
        onClose();
        setSelectedFile(null);
      }}
    >
      <div 
        className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-[540px] shadow-2xl overflow-hidden relative p-8 flex flex-col gap-6 animate-zoom-in-modal max-h-[90vh] overflow-y-auto no-scrollbar text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={() => {
            onClose();
            setSelectedFile(null);
          }}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high p-1.5 rounded-full transition-colors cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Title & Subtitle */}
        <div className="text-center">
          <h2 className="text-3xl font-serif text-on-surface tracking-tight mt-1">Import Library</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Add new titles to your Lumina Reader collection.
          </p>
        </div>

        {/* Drag & Drop Box */}
        <div 
          onClick={handleFileBrowse}
          className="border border-dashed border-outline-variant/40 hover:border-tertiary/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3.5 transition-colors bg-surface-container-low/40 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-full bg-surface-container-high border border-outline-variant/15 flex items-center justify-center text-on-surface-variant shadow-sm group-hover:bg-surface-container-highest transition-colors">
            <FiUploadCloud className="w-5 h-5 text-on-surface-variant/80" />
          </div>
          <div className="text-center space-y-0.5">
            <h3 className="font-headline-sm text-sm font-bold text-on-surface tracking-tight">
              Drag & drop files here
            </h3>
            <p className="font-body-md text-[11px] text-on-surface-variant/70">
              or click to browse your local directory
            </p>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFileBrowse();
            }}
            className="px-5 py-1.5 rounded-full bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant/20 font-bold text-xs text-on-surface transition-all active:scale-98 shadow-sm"
          >
            Browse Files
          </button>
          
          {/* Allowed extensions indicator */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/15 text-[8px] font-bold tracking-wider text-on-surface-variant/60 uppercase">EPUB</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/15 text-[8px] font-bold tracking-wider text-on-surface-variant/60 uppercase">PDF</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/15 text-[8px] font-bold tracking-wider text-on-surface-variant/60 uppercase">MOBI</span>
          </div>

          {/* Selected file preview */}
          {selectedFile && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="mt-2 text-xs font-semibold text-tertiary bg-tertiary/10 border border-tertiary/20 px-3 py-1.5 rounded-lg flex items-center gap-2 max-w-full truncate shadow-sm animate-in fade-in"
            >
              <FiFileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{selectedFile.name}</span>
            </div>
          )}
        </div>

        {/* Categorize Section */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/90 tracking-wider uppercase">
            <FiTag className="w-3.5 h-3.5 text-on-surface-variant/60" />
            <span>Categorize Import</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {customTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                    isSelected
                      ? "bg-on-surface text-surface border-on-surface shadow-sm font-extrabold"
                      : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            <button
              onClick={handleAddNewTag}
              className="px-3 py-1.5 rounded-full border border-dashed border-outline-variant/40 bg-transparent text-on-surface-variant hover:text-tertiary hover:border-tertiary/60 transition-all text-[11px] font-bold"
            >
              + New Tag
            </button>
          </div>
        </div>

        {/* Footer with Info and Buttons */}
        <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
          <p className="text-[10px] text-on-surface-variant/70 font-semibold">
            Files will be encrypted and stored locally.
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                onClose();
                setSelectedFile(null);
              }}
              className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={!selectedFile}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                selectedFile
                  ? "bg-tertiary text-on-tertiary hover:bg-tertiary/90 hover:shadow active:scale-98 cursor-pointer"
                  : "bg-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed"
              }`}
            >
              <span>Confirm Import</span>
              <span className="text-sm font-bold leading-none">→</span>
            </button>
          </div>
        </div>

        {/* Recent Imports Section */}
        {recentImports.length > 0 && (
          <div className="border-t border-outline-variant/10 pt-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/90 tracking-wider uppercase">
              <FiClock className="w-3.5 h-3.5" />
              <span>Recent Imports</span>
            </div>
            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto no-scrollbar">
              {recentImports.map((imp, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-surface-container-low/40 border border-outline-variant/10 p-2.5 rounded-lg hover:border-outline-variant/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface-variant/80 border border-outline-variant/10 shadow-sm shrink-0">
                    <FiFileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">{imp.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                      {imp.time} &bull; <span className="text-tertiary font-bold">{imp.tag}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ImportModal;
