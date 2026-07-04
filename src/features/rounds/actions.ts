"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMatchAccess } from "@/lib/match-access";
import { addRoundSchema, deleteRoundSchema } from "./schema";

export async function addRound(matchId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  addRoundSchema.parse({ matchId });

  const access = await getMatchAccess(matchId, session.user.id);
  if (!access) throw new Error("Not found");

  const [lastRound] = await db.round.findMany({
    where: { matchId },
    orderBy: { roundNumber: "desc" },
    take: 1,
    select: { roundNumber: true },
  });

  const nextRoundNumber = (lastRound?.roundNumber ?? 0) + 1;

  if (nextRoundNumber > 50) throw new Error("Maximum 50 rounds per match");

  const round = await db.round.create({
    data: { id: crypto.randomUUID(), matchId, roundNumber: nextRoundNumber },
  });

  revalidatePath(`/match/${matchId}`);
  return round;
}

export async function deleteRound(matchId: string, roundId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  deleteRoundSchema.parse({ roundId, matchId });

  const access = await getMatchAccess(matchId, session.user.id);
  if (access !== "owner") throw new Error("Not found");

  const round = await db.round.findFirst({
    where: { id: roundId, matchId },
  });
  if (!round) throw new Error("Not found");

  await db.round.delete({ where: { id: roundId } });

  revalidatePath(`/match/${matchId}`);
}
