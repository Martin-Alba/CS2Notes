import { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-zinc-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`glass-input w-full rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500 ${error ? "border-cs2-red/50" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-cs2-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
