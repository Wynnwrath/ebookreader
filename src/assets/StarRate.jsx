import React, { useState } from "react";
import { FaStar } from "react-icons/fa";

/**
 * StarRate Component
 * - Interactive star rating if onChange is provided
 * - Static read-only if onChange is NOT provided
 * - Fixes layout by removing centered alignment
 */
export default function StarRate({
  rating = 0,
  size = 24,
  onChange,         // Optional callback → interactive if provided
}) {
  
  const [hover, setHover] = useState(null);

  const isInteractive = typeof onChange === "function";

  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((value) => {
        const active = hover ? value <= hover : value <= rating;

        return (
          <FaStar
            key={value}
            size={size}
            color={active ? "#FFD700" : "#555"}  // gold / muted grey
            className={
              isInteractive
                ? "cursor-pointer transition-transform hover:scale-110"
                : "cursor-default"
            }
            onMouseEnter={() => isInteractive && setHover(value)}
            onMouseLeave={() => isInteractive && setHover(null)}
            onClick={() => isInteractive && onChange(value)}
          />
        );
      })}
    </div>
  );
}
