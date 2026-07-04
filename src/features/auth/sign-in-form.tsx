"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resent, setResent] = useState(false);
  const router = useRouter();

  const handleResend = async () => {
    setResent(false);
    const { error: resendError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: window.location.origin,
    });
    if (!resendError) setResent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResent(false);
    setPending(true);

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    setPending(false);

    if (authError) {
      if (authError.message?.toLowerCase().includes("verify") || authError.message?.toLowerCase().includes("verif")) {
        setNeedsVerification(true);
      }
      setError(authError.message ?? t("signIn"));
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{t("signIn")}</h1>
        <p className="mt-1.5 text-sm text-zinc-500">{tAuth("signInSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 transition-colors focus:border-cs2-orange/50 focus:outline-none focus:ring-1 focus:ring-cs2-orange/30"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-300">Password</label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-zinc-500 transition-colors hover:text-cs2-orange"
            >
              {tAuth("forgotPassword")}
            </Link>
          </div>
          <input
            type="password"
            name="current-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 transition-colors focus:border-cs2-orange/50 focus:outline-none focus:ring-1 focus:ring-cs2-orange/30"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        {needsVerification && !resent && (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm text-zinc-400 transition-colors hover:text-cs2-orange"
          >
            {tAuth("resendVerification")}
          </button>
        )}

        {resent && (
          <p className="text-sm text-green-400">{tAuth("verificationResent")}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-cs2-orange px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cs2-orange/80 disabled:opacity-50"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("signIn")}
            </span>
          ) : (
            t("signIn")
          )}
        </button>

        <p className="text-center text-sm text-zinc-500">
          {tAuth("noAccountYet")}{" "}
          <Link href="/auth/sign-up" className="font-medium text-zinc-300 transition-colors hover:text-cs2-orange">
            {t("signUp")}
          </Link>
        </p>
      </form>
    </div>
  );
}
