import { IoIosArrowRoundBack } from "react-icons/io";
import { FaTrash } from "react-icons/fa"; 
import GlassCard from "../../ui/GlassCard";

export default function BookHeader({ onBack, onRemove }) {
  return (
    <GlassCard className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors"
        >
          <IoIosArrowRoundBack size={34} />
          <span className="text-lg font-medium">Back</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* --- REMOVE BUTTON --- */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all text-xs sm:text-sm"
            title="Remove Book"
          >
            <FaTrash size={14} />
            <span className="hidden sm:inline">Remove</span>
          </button>
        )}
      </div>
    </GlassCard>
  );
}