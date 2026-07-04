"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type SharedResource } from "@/features/sharing/actions";
import Link from "next/link";

type GroupItem = {
  id: string;
  name: string;
  description: string | null;
  matchCount: number;
};

export function GroupsView({
  groups,
  sharedResources,
}: {
  groups: GroupItem[];
  sharedResources: SharedResource[];
}) {
  const t = useTranslations("groups");
  const [tab, setTab] = useState<"mine" | "shared">("mine");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("mine")}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "mine"
              ? "border-cs2-orange/50 bg-cs2-orange/10 text-cs2-orange glow-orange"
              : "glass-btn text-zinc-400"
          }`}
        >
          {t("myGroups")}
        </button>
        <button
          onClick={() => setTab("shared")}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "shared"
              ? "border-cs2-orange/50 bg-cs2-orange/10 text-cs2-orange glow-orange"
              : "glass-btn text-zinc-400"
          }`}
        >
          {t("sharedWithMe")}
        </button>
      </div>

      {tab === "mine" && (
        <>
          {groups.length === 0 ? (
            <p className="text-zinc-500">{t("noGroups")}</p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="glass glass-hover flex items-center justify-between rounded-lg p-4 transition-all hover:border-white/20"
                >
                  <div>
                    <p className="font-medium text-zinc-200">{group.name}</p>
                    {group.description && (
                      <p className="text-sm text-zinc-500">{group.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-zinc-500">
                    {group.matchCount} {t("matchCount")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "shared" && (
        <>
          {sharedResources.length === 0 ? (
            <p className="text-zinc-500">{t("noShared")}</p>
          ) : (
            <div className="space-y-2">
              {sharedResources.map((r) => (
                <Link
                  key={`${r.type}-${r.id}`}
                  href={`/shared/${r.token}`}
                  className="glass glass-hover flex items-center justify-between rounded-lg p-4 transition-all hover:border-white/20"
                >
                  <div>
                    <p className="font-medium text-zinc-200">{r.name}</p>
                    <p className="text-sm text-zinc-500">
                      {r.type === "GROUP" ? t("group") : t("match")} &middot; {t("by")} {r.ownerName}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">{t("shared")}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
