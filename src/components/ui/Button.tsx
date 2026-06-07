import React from "react";
import { IconType } from "react-icons";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  icon?: IconType;
  leftIcon?: IconType;
  rightIcon?: IconType;
  loading?: boolean;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "sm",
  className = "",
  icon: Icon,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  loading = false,
  disabled = false,
  ...props
}) => {
  const baseStyle = "flex items-center justify-center font-bold transition duration-200 cursor-pointer active:scale-98 disabled:opacity-50 disabled:pointer-events-none select-none w-fit";
  
  const variants = {
    primary: "bg-primary text-white hover:brightness-110 shadow-md shadow-primary/20 border border-transparent",
    secondary: "bg-surface border border-border text-text hover:border-primary/45 hover:bg-glass",
    danger: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20",
    ghost: "text-text-dim hover:text-text hover:bg-glass/30 border border-transparent"
  };

  const sizes = {
    xs: "px-2.5 py-1 rounded text-[10px]",
    sm: "px-3.5 py-1.5 rounded-lg text-xs",
    md: "px-4 py-2 rounded-lg text-sm",
    lg: "px-6 py-2.5 rounded-xl text-base"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {LeftIcon && !loading && <LeftIcon className="mr-1.5 shrink-0 w-3.5 h-3.5" />}
      {Icon && !loading && <Icon className="shrink-0 w-3.5 h-3.5" />}
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
      ) : null}
      <span>{children}</span>
      {RightIcon && !loading && <RightIcon className="ml-1.5 shrink-0 w-3.5 h-3.5" />}
    </button>
  );
};

export default Button;
