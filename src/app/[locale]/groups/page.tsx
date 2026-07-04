import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { CreateGroupForm } from "@/features/groups/create-group-form";
import { getSharedResources } from "@/features/sharing/actions";
import { GroupsView } from "./groups-view";

export default async function GroupsPage() {
  const t = await getTranslations("groups");
  const session = await getSession();

  if (!session?.user) {
    const tCommon = await getTranslations("common");
    return <p>{tCommon("signIn")} to view your groups.</p>;
  }

  const [groups, sharedResources] = await Promise.all([
    db.group.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { matches: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    getSharedResources(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-wide">{t("title")}</h1>
        <CreateGroupForm />
      </div>

      <GroupsView
        groups={groups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          matchCount: g._count.matches,
        }))}
        sharedResources={sharedResources}
      />
    </div>
  );
}
