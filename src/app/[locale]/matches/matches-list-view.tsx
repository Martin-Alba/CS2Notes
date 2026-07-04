"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

type MatchItem = {
  id: string;
  title: string;
  mapName: string;
  soloQ: boolean;
  createdAt: Date;
  group: { id: string; name: string };
  _count: { rounds: number };
};

export function MatchesListView({ matches }: { matches: MatchItem[] }) {
  const t = useTranslations("matches");

  if (matches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500 glass">
        {t("noMatches")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <Link
          key={match.id}
          href={`/match/${match.id}`}
          className="glass flex items-center justify-between rounded-lg p-4 transition-all hover:glass-hover"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-zinc-200">{match.title}</p>
            <p className="flex items-center gap-2 text-sm text-zinc-500">
              {match.group.name}
              <span className="text-zinc-600">·</span>
              {match.mapName}
              {match.soloQ && (
                <span className="rounded bg-cs2-orange/10 px-1.5 py-0.5 text-[10px] font-medium text-cs2-orange">
                  SoloQ
                </span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-500">
            <span>{match._count.rounds}r</span>
            <span>{new Date(match.createdAt).toLocaleDateString()}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
