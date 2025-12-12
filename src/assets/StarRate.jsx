import React, { useState } from "react";
import { FaStar } from "react-icons/fa";

export default function StarRate({
  rating = 0,
  size, // Optional: If provided, overrides responsive defaults
  onChange,
}) {
  const [hover, setHover] = useState(null);
  const isInteractive = typeof onChange === "function";

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((value) => {
        const isActive = hover ? value <= hover : value <= (rating || 0);

        return (
          <FaStar
            key={value}
            size={size} // Respects manual size if passed (e.g. size={22})
            className={`
              transition-all duration-300 ease-out
              ${!size ? "text-3xl sm:text-4xl md:text-5xl" : ""} /* Default: Big & Responsive */
              ${isActive 
                  ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" 
                  : "text-white/10"
              }
              ${isInteractive ? "cursor-pointer hover:scale-110 active:scale-90" : "cursor-default"}
            `}
            onMouseEnter={() => isInteractive && setHover(value)}
            onMouseLeave={() => isInteractive && setHover(null)}
            onClick={() => isInteractive && onChange(value)}
          />
        );
      })}
    </div>
  );
}