"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createShareLinkSchema } from "./schema";
import { rateLimit, strictRateLimit } from "@/lib/rate-limit";
import { publishNotification } from "@/lib/notifications";

export async function createShareLink(resourceType: "GROUP" | "MATCH", resourceId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const { success } = await rateLimit.limit(session.user.id);
  if (!success) throw new Error("Too many requests");

  const parsed = createShareLinkSchema.parse({ resourceType, resourceId });

  if (parsed.resourceType === "GROUP") {
    const group = await db.group.findFirst({
      where: { id: parsed.resourceId, ownerId: session.user.id },
      select: { id: true },
    });
    if (!group) throw new Error("Not found");
  } else {
    const match = await db.match.findFirst({
      where: { id: parsed.resourceId },
      select: { group: { select: { ownerId: true } } },
    });
    if (!match || match.group.ownerId !== session.user.id) throw new Error("Not found");
  }

  const existing = await db.shareLink.findFirst({
    where: { resourceType: parsed.resourceType, resourceId: parsed.resourceId, createdById: session.user.id },
  });
  if (existing) return existing;

  const shareLink = await db.shareLink.create({
    data: {
      id: crypto.randomUUID(),
      token: crypto.randomUUID(),
      resourceType: parsed.resourceType,
      resourceId: parsed.resourceId,
      createdById: session.user.id,
    },
  });

  return shareLink;
}

export async function deleteShareLink(shareLinkId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const shareLink = await db.shareLink.findUnique({
    where: { id: shareLinkId },
    select: { createdById: true, token: true },
  });
  if (!shareLink || shareLink.createdById !== session.user.id) throw new Error("Not found");

  await db.shareLink.delete({ where: { id: shareLinkId } });

  revalidatePath(`/shared/${shareLink.token}`);
}

export async function resolveShareLink(token: string) {
  const ip = (await headers()).get("x-forwarded-for") ?? "anonymous";
  const { success } = await rateLimit.limit(ip);
  if (!success) throw new Error("Too many requests");

  const shareLink = await db.shareLink.findUnique({
    where: { token },
    select: { id: true, resourceType: true },
  });
  if (!shareLink) return null;

  return shareLink;
}

export async function getSharedResource(shareLinkId: string) {
  const session = await getSession();
  const shareLink = await db.shareLink.findUnique({
    where: { id: shareLinkId },
    select: { id: true, createdById: true, resourceType: true, resourceId: true, token: true },
  });
  if (!shareLink) return null;

  const isOwner = session?.user && shareLink.createdById === session.user.id;
  const hasApprovedAccess = session?.user
    ? await db.accessRequest.findFirst({
        where: { shareLinkId, requesterId: session.user.id, status: "APPROVED" },
      })
    : null;

  if (!isOwner && !hasApprovedAccess) return { shareLink, resource: null, access: "none" as const };

  if (shareLink.resourceType === "GROUP") {
    const resource = await db.group.findUnique({
      where: { id: shareLink.resourceId },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { matches: true } },
        owner: { select: { name: true } },
      },
    });
    return { shareLink, resource, access: isOwner ? ("owner" as const) : ("view" as const) };
  }

  if (shareLink.resourceType === "MATCH") {
    const resource = await db.match.findUnique({
      where: { id: shareLink.resourceId },
      select: {
        id: true,
        title: true,
        mapName: true,
        group: { select: { name: true, ownerId: true } },
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
                errorTags: { select: { tag: { select: { id: true, name: true } } } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    });
    return { shareLink, resource, access: isOwner ? ("owner" as const) : ("view" as const) };
  }

  return null;
}

export async function requestAccess(shareLinkId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const { success } = await strictRateLimit.limit(session.user.id);
  if (!success) throw new Error("Too many requests");

  const shareLink = await db.shareLink.findUnique({
    where: { id: shareLinkId },
    select: { id: true, createdById: true, resourceType: true, resourceId: true },
  });
  if (!shareLink) throw new Error("Share link not found");

  const existing = await db.accessRequest.findFirst({
    where: { shareLinkId, requesterId: session.user.id, status: "PENDING" },
  });
  if (existing) return existing;

  const accessRequest = await db.accessRequest.create({
    data: {
      id: crypto.randomUUID(),
      shareLinkId,
      requesterId: session.user.id,
    },
  });

  await db.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId: shareLink.createdById,
      type: "ACCESS_REQUEST",
      metadata: {
        accessRequestId: accessRequest.id,
        shareLinkId,
        requesterId: session.user.id,
        requesterName: session.user.name,
        resourceType: shareLink.resourceType,
        resourceId: shareLink.resourceId,
      },
    },
  });

  await publishNotification(shareLink.createdById, {
    type: "ACCESS_REQUEST",
    accessRequestId: accessRequest.id,
    requesterName: session.user.name,
  });

  return accessRequest;
}

export async function getAccessRequests(shareLinkId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const shareLink = await db.shareLink.findUnique({
    where: { id: shareLinkId },
    select: { id: true, createdById: true },
  });
  if (!shareLink || shareLink.createdById !== session.user.id) throw new Error("Not found");

  return db.accessRequest.findMany({
    where: { shareLinkId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      requester: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveAccess(requestId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const request = await db.accessRequest.findUnique({
    where: { id: requestId },
    include: { shareLink: true },
  });
  if (!request || request.shareLink.createdById !== session.user.id) throw new Error("Not found");

  await db.accessRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });

  const ownerNotification = await db.notification.findFirst({
    where: { userId: session.user.id, type: "ACCESS_REQUEST", metadata: { path: ["accessRequestId"], equals: requestId } },
  });
  if (ownerNotification) {
    await db.notification.update({ where: { id: ownerNotification.id }, data: { read: true } });
  }

  await db.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId: request.requesterId,
      type: "ACCESS_APPROVED",
      metadata: {
        shareLinkId: request.shareLinkId,
        resourceType: request.shareLink.resourceType,
        resourceId: request.shareLink.resourceId,
      },
    },
  });

  await publishNotification(request.requesterId, {
    type: "ACCESS_APPROVED",
    shareLinkId: request.shareLinkId,
    resourceType: request.shareLink.resourceType,
  });

  revalidatePath(`/shared/${request.shareLink.token}`);
}

export async function rejectAccess(requestId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const request = await db.accessRequest.findUnique({
    where: { id: requestId },
    include: { shareLink: true },
  });
  if (!request || request.shareLink.createdById !== session.user.id) throw new Error("Not found");

  await db.accessRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  const ownerNotification = await db.notification.findFirst({
    where: { userId: session.user.id, type: "ACCESS_REQUEST", metadata: { path: ["accessRequestId"], equals: requestId } },
  });
  if (ownerNotification) {
    await db.notification.update({ where: { id: ownerNotification.id }, data: { read: true } });
  }
}

export async function getNotifications() {
  const session = await getSession();
  if (!session?.user) return [];

  return db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function markNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  await db.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });
}

export type SharedResource = {
  type: "GROUP" | "MATCH";
  id: string;
  name: string;
  description?: string | null;
  token: string;
  ownerName: string;
};

export async function getSharedResources(): Promise<SharedResource[]> {
  const session = await getSession();
  if (!session?.user) return [];

  const approved = await db.accessRequest.findMany({
    where: { requesterId: session.user.id, status: "APPROVED" },
    include: {
      shareLink: {
        select: { token: true, resourceType: true, resourceId: true, createdById: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const groupIds = approved.filter((r) => r.shareLink.resourceType === "GROUP").map((r) => r.shareLink.resourceId);
  const matchIds = approved.filter((r) => r.shareLink.resourceType === "MATCH").map((r) => r.shareLink.resourceId);
  const ownerIds = [...new Set(approved.map((r) => r.shareLink.createdById))];

  const [groups, matches, owners] = await Promise.all([
    groupIds.length > 0
      ? db.group.findMany({ where: { id: { in: groupIds } }, select: { id: true, name: true, description: true } })
      : [],
    matchIds.length > 0
      ? db.match.findMany({ where: { id: { in: matchIds } }, select: { id: true, title: true } })
      : [],
    ownerIds.length > 0
      ? db.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true } })
      : [],
  ]);

  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const matchMap = new Map(matches.map((m) => [m.id, m]));
  const ownerMap = new Map(owners.map((o) => [o.id, o.name]));

  const results: SharedResource[] = [];

  for (const req of approved) {
    const { token, resourceType, resourceId, createdById } = req.shareLink;
    const ownerName = ownerMap.get(createdById) ?? "Unknown";

    if (resourceType === "GROUP") {
      const group = groupMap.get(resourceId);
      if (group) {
        results.push({ type: "GROUP", ...group, token, ownerName });
      }
    }

    if (resourceType === "MATCH") {
      const match = matchMap.get(resourceId);
      if (match) {
        results.push({ type: "MATCH", id: match.id, name: match.title, token, ownerName });
      }
    }
  }

  return results;
}

export async function getPendingAccessRequests() {
  const session = await getSession();
  if (!session?.user) return [];

  return db.accessRequest.findMany({
    where: {
      shareLink: { createdById: session.user.id },
      status: "PENDING",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      requester: { select: { id: true, name: true, email: true } },
      shareLink: { select: { id: true, token: true, resourceType: true, resourceId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
