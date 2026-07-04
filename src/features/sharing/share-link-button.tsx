"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createShareLink, deleteShareLink } from "./actions";

export function ShareLinkButton({
  resourceType,
  resourceId,
}: {
  resourceType: "GROUP" | "MATCH";
  resourceId: string;
}) {
  const t = useTranslations("sharing");
  const [url, setUrl] = useState("");
  const [shareLinkId, setShareLinkId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const link = await createShareLink(resourceType, resourceId);
    setShareLinkId(link.id);
    setUrl(`${window.location.origin}/shared/${link.token}`);
  };

  const handleRevoke = async () => {
    await deleteShareLink(shareLinkId);
    setUrl("");
    setShareLinkId("");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!url) {
    return (
      <button
        onClick={handleCreate}
        className="glass-btn rounded-lg px-3 py-1.5 text-sm text-zinc-300"
      >
        {t("shareLink")}
      </button>
    );
  }

  return (
    <div className="flex w-full flex-wrap gap-2">
      <input
        value={url}
        readOnly
        className="glass-input min-w-0 flex-1 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500"
      />
      <button
        onClick={handleCopy}
        className="glass-btn rounded-lg border border-cs2-orange/30 bg-cs2-orange/10 px-3 py-1.5 text-xs text-cs2-orange hover:bg-cs2-orange/20 glow-orange"
      >
        {copied ? t("accessRequested") : t("copyLink")}
      </button>
      <button
        onClick={handleRevoke}
        className="glass-btn rounded-lg border border-cs2-red/30 bg-cs2-red/10 px-3 py-1.5 text-xs text-cs2-red hover:bg-cs2-red/20 glow-red"
      >
        {t("revoke")}
      </button>
    </div>
  );
}
