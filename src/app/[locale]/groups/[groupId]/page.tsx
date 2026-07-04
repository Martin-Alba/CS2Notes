import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { GroupDetailView } from "../group-detail-view";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const session = await getSession();
  if (!session?.user) {
    const tCommon = await getTranslations("common");
    return <p>{tCommon("signIn")} to view this group.</p>;
  }

  const group = await db.group.findFirst({
    where: { id: groupId, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      description: true,
      matches: {
        select: { id: true, title: true, mapName: true, soloQ: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) notFound();

  return <GroupDetailView group={group} />;
}
