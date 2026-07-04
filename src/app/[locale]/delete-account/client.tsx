"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { confirmAccountDeletion } from "@/features/auth/actions";

export function DeleteAccountPageClient() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(() => !!token);
  const [error, setError] = useState(() => !token);

  useEffect(() => {
    if (!token) return;
    confirmAccountDeletion(token).then((result) => {
      if (result.error) setError(true);
      setLoading(false);
    });
  }, [token]);

  if (!token || error) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("deleteAccount")}</h1>
        <p className="text-sm text-red-500">{t("invalidToken")}</p>
        <p className="text-sm text-zinc-500">
          <Link href="/settings" className="text-zinc-400 transition-colors hover:text-cs2-orange">
            {t("backToSettings")}
          </Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("deleteAccount")}</h1>
        <p className="text-sm text-zinc-400">{t("deletingAccount")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 text-center">
      <h1 className="text-2xl font-bold">{t("deleteAccount")}</h1>
      <p className="text-sm text-green-400">{t("accountDeleted")}</p>
      <p className="text-sm text-zinc-500">
        <Link href="/auth/sign-up" className="text-zinc-400 transition-colors hover:text-cs2-orange">
          {t("createNewAccount")}
        </Link>
      </p>
    </div>
  );
}
