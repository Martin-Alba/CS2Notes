import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";

const MatchView = dynamic(() => import("@/features/matches/match-view").then((m) => ({ default: m.MatchView })), {
  loading: () => <div className="h-96 animate-pulse rounded-lg bg-white/[0.03]" />,
});

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const t = await getTranslations("common");
  const { matchId } = await params;
  const session = await getSession();
  if (!session?.user) return <p>{t("signIn")} to view this match.</p>;

  const match = await db.match.findFirst({
    where: { id: matchId },
    select: {
      id: true,
      title: true,
      mapName: true,
      soloQ: true,
      createdAt: true,
      group: { select: { id: true, ownerId: true, name: true } },
      rounds: {
        select: {
          id: true,
          roundNumber: true,
          createdAt: true,
          notes: {
            select: {
              id: true,
              content: true,
              severity: true,
              type: true,
              createdAt: true,
              updatedAt: true,
              user: { select: { id: true, name: true } },
              errorTags: { select: { tag: { select: { id: true, name: true } } } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { roundNumber: "asc" },
      },
    },
  });

  if (!match || match.group.ownerId !== session.user.id) notFound();

  const tags = await db.tag.findMany({
    where: {
      OR: [
        { type: "PREDEFINED" },
        { userId: session.user.id, type: "CUSTOM" },
      ],
    },
    select: { id: true, name: true, type: true },
  });

  return (
    <div className="space-y-6">
      <MatchView match={match} tags={tags} userId={session.user.id} userName={session.user.name} />
    </div>
  );
}
