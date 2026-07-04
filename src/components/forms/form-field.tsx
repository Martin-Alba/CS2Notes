import { type ReactNode } from "react";

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-zinc-400">{label}</label>
      {children}
      {error && <p className="text-xs text-cs2-red">{error}</p>}
    </div>
  );
}
