"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { PasswordInput } from "@/components/ui/password-input";

const mailboxLinks: Record<string, string> = {
  "gmail.com": "https://mail.google.com",
  "outlook.com": "https://outlook.live.com",
  "hotmail.com": "https://outlook.live.com",
  "live.com": "https://outlook.live.com",
  "live.com.ar": "https://outlook.live.com",
  "yahoo.com": "https://mail.yahoo.com",
  "proton.me": "https://mail.proton.me",
  "protonmail.com": "https://mail.proton.me",
};

function getMailboxUrl(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? (mailboxLinks[domain] ?? null) : null;
}

export function SignUpForm() {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [accountExists, setAccountExists] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAccountExists(false);
    setPending(true);

    const { data, error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setPending(false);

    if (authError) {
      setError(authError.message ?? t("signUp"));
      return;
    }

    if (!data) {
      setAccountExists(true);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    const mailboxUrl = getMailboxUrl(email);
    const domain = email.split("@")[1]?.toLowerCase();
    const btnLabel = domain && mailboxLinks[domain]
      ? ({
          "gmail.com": tAuth("goToGmail"),
          "outlook.com": tAuth("goToOutlook"),
          "hotmail.com": tAuth("goToHotmail"),
          "live.com": tAuth("goToOutlook"),
          "live.com.ar": tAuth("goToOutlook"),
          "yahoo.com": tAuth("goToYahoo"),
          "proton.me": tAuth("goToProton"),
          "protonmail.com": tAuth("goToProton"),
        } as Record<string, string>)[domain] ?? tAuth("goToMailbox")
      : tAuth("goToMailbox");
    return (
      <div className="glass-card mx-auto w-full max-w-sm rounded-xl p-8 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">{tAuth("verificationSent")}</h1>
        <p className="mt-2 text-sm text-zinc-400">{tAuth("checkEmail")}</p>
        <p className="mt-1 text-sm font-medium text-zinc-300">{email}</p>
        {mailboxUrl && (
          <a
            href={mailboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cs2-orange px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cs2-orange/80"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {btnLabel}
          </a>
        )}
        <p className="mt-6 text-sm text-zinc-500">
          <Link href="/auth/sign-in" className="font-medium text-zinc-300 transition-colors hover:text-cs2-orange">
            {t("signIn")} &rarr;
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{t("signUp")}</h1>
        <p className="mt-1.5 text-sm text-zinc-500">{tAuth("signUpSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Name</label>
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 transition-colors focus:border-cs2-orange/50 focus:outline-none focus:ring-1 focus:ring-cs2-orange/30"
          />
        </div>

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

        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
        />

        {accountExists && (
          <div className="rounded-lg bg-amber-500/10 px-3.5 py-3 text-sm">
            <p className="text-amber-400">{tAuth("accountExists")}</p>
            <Link
              href="/auth/sign-in"
              className="mt-1 inline-block font-medium text-amber-300 underline decoration-amber-500/30 underline-offset-2 transition-colors hover:text-amber-200"
            >
              {t("signIn")} &rarr;
            </Link>
          </div>
        )}

        {error && !accountExists && (
          <div className="rounded-lg bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
            {error}
          </div>
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
              {t("signUp")}
            </span>
          ) : (
            t("signUp")
          )}
        </button>

        <p className="text-center text-sm text-zinc-500">
          {tAuth("alreadyHaveAccount")}{" "}
          <Link href="/auth/sign-in" className="font-medium text-zinc-300 transition-colors hover:text-cs2-orange">
            {t("signIn")}
          </Link>
        </p>
      </form>
    </div>
  );
}
