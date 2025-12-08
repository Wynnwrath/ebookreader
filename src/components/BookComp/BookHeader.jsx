import { IoIosArrowRoundBack } from "react-icons/io";
import { SlOptionsVertical } from "react-icons/sl";
import GlassCard from "../../ui/GlassCard";

export default function BookHeader({ onBack, onMenu }) {
  return (
    <GlassCard className="flex items-center justify-between px-6 py-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors"
      >
        <IoIosArrowRoundBack size={34} />
        <span className="text-lg font-medium">Back</span>
      </button>

      {/* Options Menu */}
      {onMenu && (
        <button
          onClick={onMenu}
          className="text-white hover:text-orange-400 transition-colors"
        >
          <SlOptionsVertical size={22} />
        </button>
      )}
    </GlassCard>
  );
}