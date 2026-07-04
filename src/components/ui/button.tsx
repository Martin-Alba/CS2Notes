import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "primary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  default: "glass-btn text-zinc-300 hover:text-white",
  primary: "border border-cs2-orange/30 bg-cs2-orange/10 text-cs2-orange hover:bg-cs2-orange/20 glow-orange",
  danger: "border border-cs2-red/30 bg-cs2-red/10 text-cs2-red hover:bg-cs2-red/20 glow-red",
  ghost: "text-zinc-500 hover:text-zinc-300",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

export function Button({
  variant = "default",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="inline-block animate-pulse">...</span> : children}
    </button>
  );
}
