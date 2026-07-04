"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getSettingsData() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const [customTags, shareLinks, accessRequests, pendingRequests] = await Promise.all([
    db.tag.findMany({
      where: { userId: session.user.id, type: "CUSTOM" },
      orderBy: { name: "asc" },
    }),
    db.shareLink.findMany({
      where: { createdById: session.user.id },
      select: {
        id: true,
        token: true,
        resourceType: true,
        resourceId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.accessRequest.findMany({
      where: { shareLink: { createdById: session.user.id } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        requester: { select: { id: true, name: true, email: true } },
        shareLink: { select: { token: true, resourceType: true, resourceId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.accessRequest.count({
      where: { shareLink: { createdById: session.user.id }, status: "PENDING" },
    }),
  ]);

  return {
    user: { id: session.user.id, name: session.user.name, email: session.user.email },
    customTags,
    shareLinks,
    accessRequests,
    pendingRequests,
  };
}
