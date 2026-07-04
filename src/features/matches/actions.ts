"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createMatchSchema, updateMatchSchema } from "./schema";

export async function createMatch(formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = createMatchSchema.parse({
    title: formData.get("title"),
    mapName: formData.get("mapName"),
    groupId: formData.get("groupId"),
    soloQ: formData.get("soloQ") === "true",
  });

  const group = await db.group.findFirst({
    where: { id: parsed.groupId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!group) throw new Error("Group not found");

  const match = await db.match.create({
    data: {
      id: crypto.randomUUID(),
      title: parsed.title,
      mapName: parsed.mapName,
      groupId: parsed.groupId,
      soloQ: parsed.soloQ,
    },
  });

  revalidatePath(`/groups/${parsed.groupId}`);
  return match;
}

export async function deleteMatch(id: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const match = await db.match.findFirst({
    where: { id },
    include: { group: { select: { ownerId: true } } },
  });
  if (!match || match.group.ownerId !== session.user.id)
    throw new Error("Not found");

  await db.match.delete({ where: { id } });
  revalidatePath(`/groups/${match.groupId}`);
}

export async function updateMatch(id: string, formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = updateMatchSchema.parse({
    title: formData.get("title") || undefined,
    mapName: formData.get("mapName") || undefined,
    soloQ: formData.has("soloQ") ? formData.get("soloQ") === "true" : undefined,
  });

  const match = await db.match.findFirst({
    where: { id },
    include: { group: { select: { ownerId: true } } },
  });
  if (!match || match.group.ownerId !== session.user.id)
    throw new Error("Not found");

  const data: Record<string, string | boolean> = {};
  if (parsed.title) data.title = parsed.title;
  if (parsed.mapName) data.mapName = parsed.mapName;
  if (parsed.soloQ !== undefined) data.soloQ = parsed.soloQ;

  if (Object.keys(data).length === 0) return match;

  await db.match.update({ where: { id }, data });
  revalidatePath(`/groups/${match.groupId}`);
  return match;
}
