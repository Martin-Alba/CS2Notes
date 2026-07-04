"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { requestAccess } from "./actions";

export function AccessRequestButton({
  shareLinkId,
}: {
  shareLinkId: string;
}) {
  const t = useTranslations("sharing");
  const router = useRouter();
  const [requested, setRequested] = useState(false);
  const [pending, setPending] = useState(false);

  const handleRequest = async () => {
    setPending(true);
    try {
      await requestAccess(shareLinkId);
      setRequested(true);
      router.refresh();
    } catch {
      setRequested(false);
    }
    setPending(false);
  };

  if (requested) {
    return (
      <p className="text-sm text-zinc-500">{t("pending")}</p>
    );
  }

  return (
    <button
      onClick={handleRequest}
      disabled={pending}
      className="glass-btn rounded-lg px-6 py-2 text-sm text-white hover:text-cs2-orange glow-orange disabled:opacity-50"
    >
      {pending ? "..." : t("requestAccess")}
    </button>
  );
}
