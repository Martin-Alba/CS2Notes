"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import Link from "next/link";

export function ResetPasswordPageClient() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("resetPassword")}</h1>
        <p className="text-sm text-red-500">{t("invalidToken")}</p>
        <p className="text-sm text-zinc-500">
          <Link href="/auth/forgot-password" className="text-zinc-400 transition-colors hover:text-cs2-orange">
            {t("requestNewReset")}
          </Link>
        </p>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
