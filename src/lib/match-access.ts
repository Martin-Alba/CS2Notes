import { db } from "@/lib/db";

export type MatchAccess = "owner" | "viewer" | null;

export async function getMatchAccess(matchId: string, userId: string): Promise<MatchAccess> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { groupId: true, group: { select: { ownerId: true } } },
  });
  if (!match) return null;

  if (match.group.ownerId === userId) return "owner";

  const hasAccess = await db.accessRequest.findFirst({
    where: {
      requesterId: userId,
      status: "APPROVED",
      shareLink: {
        OR: [
          { resourceType: "MATCH", resourceId: matchId },
          { resourceType: "GROUP", resourceId: match.groupId },
        ],
      },
    },
  });

  return hasAccess ? "viewer" : null;
}

export async function getNoteAccess(noteId: string, userId: string): Promise<MatchAccess> {
  const note = await db.note.findUnique({
    where: { id: noteId },
    select: {
      userId: true,
      round: {
        select: { matchId: true, match: { select: { groupId: true, group: { select: { ownerId: true } } } } },
      },
    },
  });
  if (!note) return null;

  if (note.round.match.group.ownerId === userId) return "owner";

  const hasAccess = await db.accessRequest.findFirst({
    where: {
      requesterId: userId,
      status: "APPROVED",
      shareLink: {
        OR: [
          { resourceType: "MATCH", resourceId: note.round.matchId },
          { resourceType: "GROUP", resourceId: note.round.match.groupId },
        ],
      },
    },
  });

  if (!hasAccess) return null;
  return note.userId === userId ? "viewer" : null;
}
