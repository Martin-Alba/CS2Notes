"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error: authError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setPending(false);

    if (authError) {
      setError(authError.message ?? t("forgotPassword"));
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("forgotPassword")}</h1>
        <p className="text-sm text-zinc-400">{t("resetSent")}</p>
        <p className="text-sm text-zinc-500">
          <Link href="/auth/sign-in" className="text-zinc-400 transition-colors hover:text-cs2-orange">
            {t("backToSignIn")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">{t("forgotPassword")}</h1>
      <p className="text-sm text-zinc-400">{t("forgotPasswordHint")}</p>

      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="glass-input w-full rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="glass-btn w-full rounded-lg px-4 py-2 text-sm text-white hover:text-cs2-orange glow-orange disabled:opacity-50"
      >
        {pending ? "..." : t("sendResetLink")}
      </button>

      <p className="text-center text-sm text-zinc-500">
        <Link href="/auth/sign-in" className="text-zinc-400 transition-colors hover:text-cs2-orange">
          {t("backToSignIn")}
        </Link>
      </p>
    </form>
  );
}
