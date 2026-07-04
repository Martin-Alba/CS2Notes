"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMatchAccess, getNoteAccess } from "@/lib/match-access";
import { addNoteSchema, updateNoteSchema } from "./schema";

export async function addNote(roundId: string, content: string, severity: number, type: "ERROR" | "HIT" = "ERROR") {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = addNoteSchema.parse({ content, severity, type });

  const round = await db.round.findUnique({
    where: { id: roundId },
    select: { matchId: true, match: { select: { groupId: true } } },
  });
  if (!round) throw new Error("Not found");

  const access = await getMatchAccess(round.matchId, session.user.id);
  if (!access) throw new Error("Not found");

  const note = await db.note.create({
    data: { id: crypto.randomUUID(), roundId, userId: session.user.id, content: parsed.content, severity: parsed.severity, type: parsed.type },
  });

  revalidatePath(`/match/${round.matchId}`);
  return note;
}

export async function deleteNote(noteId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const note = await db.note.findUnique({
    where: { id: noteId },
    select: { userId: true, round: { select: { matchId: true, match: { select: { groupId: true } } } } },
  });
  if (!note) throw new Error("Not found");

  const access = await getNoteAccess(noteId, session.user.id);
  if (!access) throw new Error("Not found");

  await db.note.delete({ where: { id: noteId } });
  revalidatePath(`/match/${note.round.matchId}`);
}

export async function updateNote(
  noteId: string,
  data: { content?: string; severity?: number; type?: "ERROR" | "HIT" }
) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = updateNoteSchema.parse(data);

  const note = await db.note.findUnique({
    where: { id: noteId },
    select: { round: { select: { matchId: true } } },
  });
  if (!note) throw new Error("Not found");

  const access = await getNoteAccess(noteId, session.user.id);
  if (!access) throw new Error("Not found");

  const updated = await db.note.update({
    where: { id: noteId },
    data: parsed,
  });

  revalidatePath(`/match/${note.round.matchId}`);
  return updated;
}
