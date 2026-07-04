import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { MatchesListView } from "./matches-list-view";

export default async function MatchesPage() {
  const t = await getTranslations("matches");
  const session = await getSession();
  if (!session?.user) {
    const tCommon = await getTranslations("common");
    return <p>{tCommon("signIn")} to view your matches.</p>;
  }

  const matches = await db.match.findMany({
    where: { group: { ownerId: session.user.id } },
    select: {
      id: true,
      title: true,
      mapName: true,
      soloQ: true,
      createdAt: true,
      group: { select: { id: true, name: true } },
      _count: { select: { rounds: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold tracking-wide">{t("title")}</h1>
      <MatchesListView matches={matches} />
    </div>
  );
}
