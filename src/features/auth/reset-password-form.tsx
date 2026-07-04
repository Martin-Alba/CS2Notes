"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { PasswordInput } from "@/components/ui/password-input";
import { validatePassword } from "@/lib/password";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordsDontMatch"));
      return;
    }

    if (!validatePassword(password).valid) {
      setError(t("passwordRequirements"));
      return;
    }

    setPending(true);

    const { error: authError } = await authClient.resetPassword({
      token,
      newPassword: password,
    });

    setPending(false);

    if (authError) {
      setError(authError.message ?? t("resetPassword"));
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/auth/sign-in");
    }, 3000);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("resetPassword")}</h1>
        <p className="text-sm text-green-400">{t("resetSuccess")}</p>
        <p className="text-sm text-zinc-500">
          <Link href="/auth/sign-in" className="text-zinc-400 transition-colors hover:text-cs2-orange">
            {t("signInNow")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">{t("resetPassword")}</h1>
      <p className="text-sm text-zinc-400">{t("resetPasswordHint")}</p>

      <PasswordInput
        label={t("newPassword")}
        value={password}
        onChange={setPassword}
      />

      <div>
        <label className="mb-1 block text-sm font-medium">{t("confirmPassword")}</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="glass-input w-full rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="glass-btn w-full rounded-lg px-4 py-2 text-sm text-white hover:text-cs2-orange glow-orange disabled:opacity-50"
      >
        {pending ? "..." : t("resetPassword")}
      </button>

      <p className="text-center text-sm text-zinc-500">
        <Link href="/auth/sign-in" className="text-zinc-400 transition-colors hover:text-cs2-orange">
          {t("backToSignIn")}
        </Link>
      </p>
    </form>
  );
}
