import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  variant?: "default" | "glass" | "spotlight";
  animate?: boolean;
  stagger?: number;
  hoverEffect?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  onClick,
  variant = "default",
  animate = false,
  stagger = 0,
  hoverEffect = false,
  className = "",
  ...props
}) => {
  const baseStyle = "p-4 rounded-xl border";
  
  const variants = {
    default: "bg-surface border-border",
    glass: "bg-surface border border-border/60 bg-glass/30 relative overflow-hidden",
    spotlight: "p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-surface to-surface border border-border/80 relative overflow-hidden"
  };

  let animClasses = "";
  if (animate) {
    animClasses = `card-entry ${stagger ? `stagger-${stagger}` : ""}`;
  }

  const hoverClass = hoverEffect ? "book-card-hover cursor-pointer" : "";

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${animClasses} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
