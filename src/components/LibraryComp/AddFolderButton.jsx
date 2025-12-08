// src/components/FolderComp/AddFolderButton.jsx
import { FaPlus } from "react-icons/fa";
import GlassCard from "../../ui/GlassCard";

/**
 * AddFolderButton
 * - `onClick` comes from the parent and should trigger the "add/import folder" flow.
 * - Backend / Tauri integration (creating or importing folders) should live in that handler,
 *   not inside this component.
 */
export default function AddFolderButton({ onClick, centered }) {
  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
        <button
          onClick={onClick}
          className="handle-add-folder-main flex items-center justify-center bg-gradient-to-br from-[#ff8a00] to-[#ff4500] hover:from-[#ff9f40] hover:to-[#ff5c00] text-white p-5 rounded-full shadow-lg shadow-orange-600/30 transition-transform hover:scale-110"
        >
          <FaPlus size={28} />
        </button>

        <div>
          <p className="text-white text-lg font-medium">No folders added yet.</p>
          <p className="text-white text-sm">
            Click the + button to add your first folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="handle-add-folder rounded-full transition-transform hover:scale-110"
      title="Add folder"
    >
      <GlassCard
        padding="p-4"
        rounded="rounded-full"
        className="flex items-center justify-center shadow-lg shadow-orange-600/30 text-white"
      >
        <FaPlus size={22} />
      </GlassCard>
    </button>
  );
}
