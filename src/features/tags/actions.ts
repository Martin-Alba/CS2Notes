"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getNoteAccess } from "@/lib/match-access";
import { createCustomTagSchema } from "./schema";

export async function addTagToNote(noteId: string, tagId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const note = await db.note.findUnique({
    where: { id: noteId },
    select: { round: { select: { matchId: true } } },
  });
  if (!note) throw new Error("Not found");

  const access = await getNoteAccess(noteId, session.user.id);
  if (!access) throw new Error("Not found");

  await db.errorNoteTag.upsert({
    where: { noteId_tagId: { noteId, tagId } },
    create: { noteId, tagId },
    update: {},
  });

  revalidatePath(`/match/${note.round.matchId}`);
}

export async function removeTagFromNote(noteId: string, tagId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const note = await db.note.findUnique({
    where: { id: noteId },
    select: { round: { select: { matchId: true } } },
  });
  if (!note) throw new Error("Not found");

  const access = await getNoteAccess(noteId, session.user.id);
  if (!access) throw new Error("Not found");

  await db.errorNoteTag.delete({
    where: { noteId_tagId: { noteId, tagId } },
  });

  revalidatePath(`/match/${note.round.matchId}`);
}

export async function createCustomTag(name: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = createCustomTagSchema.parse({ name });

  const customCount = await db.tag.count({
    where: { userId: session.user.id, type: "CUSTOM" },
  });
  if (customCount >= 3) throw new Error("Maximum 3 custom tags");

  const tag = await db.tag.create({
    data: {
      id: crypto.randomUUID(),
      name: parsed.name,
      type: "CUSTOM",
      userId: session.user.id,
    },
  });

  return tag;
}

export async function deleteCustomTag(tagId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const tag = await db.tag.findUnique({
    where: { id: tagId },
    select: { userId: true, type: true },
  });
  if (!tag || tag.userId !== session.user.id) throw new Error("Not found");
  if (tag.type !== "CUSTOM") throw new Error("Cannot delete predefined tags");

  const affectedNotes = await db.errorNoteTag.findMany({
    where: { tagId },
    select: { note: { select: { round: { select: { matchId: true } } } } },
  });

  await db.tag.delete({ where: { id: tagId } });

  const paths = new Set(affectedNotes.map((en) => `/match/${en.note.round.matchId}`));
  for (const path of paths) {
    revalidatePath(path);
  }
}
