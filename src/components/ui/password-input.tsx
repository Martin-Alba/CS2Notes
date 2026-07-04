"use client";

import { useTranslations } from "next-intl";
import { validatePassword, type PasswordCheck } from "@/lib/password";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id?: string;
  showChecks?: boolean;
};

const checkLabels: Record<PasswordCheck["key"], string> = {
  minLength: "auth.passwordMinLength",
  uppercase: "auth.passwordUppercase",
  lowercase: "auth.passwordLowercase",
  number: "auth.passwordNumber",
  special: "auth.passwordSpecial",
};

export function PasswordInput({ value, onChange, label, id, showChecks = true }: PasswordInputProps) {
  const t = useTranslations();
  const { checks } = validatePassword(value);
  const hasValue = value.length > 0;

  return (
    <div className="space-y-1">
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      <input
        id={id}
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 transition-colors focus:border-cs2-orange/50 focus:outline-none focus:ring-1 focus:ring-cs2-orange/30"
      />
      {showChecks && hasValue && (
        <ul className="space-y-0.5 pt-1">
          {checks.map((check) => (
            <li key={check.key} className="flex items-center gap-1.5 text-xs">
              <span className={check.met ? "text-green-400" : "text-zinc-500"}>
                {check.met ? "✓" : "○"}
              </span>
              <span className={check.met ? "text-green-400" : "text-zinc-400"}>
                {t(checkLabels[check.key])}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
