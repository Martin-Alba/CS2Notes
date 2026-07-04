import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SharedNoteSection } from "./shared-note-section";
import Link from "next/link";

type SharedGroup = {
  id: string;
  name: string;
  description: string | null;
  owner: { name: string };
  _count: { matches: number };
};

export async function SharedGroupView({
  group,
  isOwner,
}: {
  group: SharedGroup;
  isOwner: boolean;
}) {
  const t = await getTranslations("groups");
  const tMatch = await getTranslations("matches");
  const tCommon = await getTranslations("common");
  const session = await getSession();

  const matches = await db.match.findMany({
    where: { groupId: group.id },
    select: {
      id: true,
      title: true,
      mapName: true,
      createdAt: true,
      rounds: {
        select: {
          id: true,
          roundNumber: true,
          notes: {
            select: {
              id: true,
              content: true,
              severity: true,
              type: true,
              user: { select: { id: true, name: true } },
              errorTags: {
                select: { tag: { select: { id: true, name: true } } },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { roundNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-lg p-4">
        <p className="mb-1 text-xs text-zinc-400">
          {tCommon("sharedBy")} {group.owner.name}
        </p>
        <h1 className="text-2xl font-bold">{group.name}</h1>
        {group.description && (
          <p className="mt-1 text-zinc-500">{group.description}</p>
        )}
        <p className="mt-1 text-sm text-zinc-500">
          {group._count.matches} {tMatch("title")}
        </p>
        {isOwner && (
          <Link
            href={`/groups/${group.id}`}
            className="glass-btn mt-3 inline-block rounded-lg px-4 py-2 text-sm text-white hover:text-cs2-orange glow-orange"
          >
            {t("title")}
          </Link>
        )}
      </div>

      {matches.map((match) => (
        <div key={match.id} className="glass-card rounded-lg p-4">
          <h2 className="text-lg font-semibold">{match.title}</h2>
          <p className="text-sm text-zinc-500">{match.mapName}</p>

          {match.rounds.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">No rounds yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {match.rounds.map((round) => (
                <div key={round.id} className="border-t border-zinc-800 pt-3">
                  <SharedNoteSection
                    roundId={round.id}
                    roundNumber={round.roundNumber}
                    initialNotes={round.notes}
                    userId={session?.user?.id ?? ""}
                    userName={session?.user?.name ?? ""}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
