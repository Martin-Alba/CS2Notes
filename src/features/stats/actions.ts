"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { DateFilter } from "./utils";
import { resolveDateRange } from "./utils";
import { redis as redisClient } from "@/lib/redis";

const CACHE_TTL = 300;

const localCache = new Map<string, { data: unknown; expiry: number }>();

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redisClient.get<T>(key);
  } catch {
    const local = localCache.get(key);
    if (local && local.expiry > Date.now()) {
      return local.data as T;
    }
    return null;
  }
}

async function cacheSet(key: string, data: unknown): Promise<void> {
  try {
    await redisClient.set(key, data, { ex: CACHE_TTL });
  } catch {
    localCache.set(key, { data, expiry: Date.now() + CACHE_TTL * 1000 });
  }
}

function cacheKey(userId: string, fn: string, params: Record<string, unknown>): string {
  return "stats:v2:" + userId + ":" + fn + ":" + JSON.stringify(params);
}

export type NoteDetail = {
  id: string;
  content: string;
  severity: number;
  type: "ERROR" | "HIT";
  createdAt: Date;
  roundNumber: number;
  matchTitle: string;
  matchMap: string;
  matchSoloQ: boolean;
  groupName: string;
  groupOwnerId: string;
  userId: string;
  userName: string;
  tags: string[];
};

export type StatsFilters = {
  groups: { id: string; name: string; ownerName?: string }[];
};

export type StatsResult = {
  byTag: { tagName: string; count: number }[];
  bySeverity: { severity: number; count: number }[];
  totalNotes: number;
};

export type MatchPerformance = {
  matchId: string;
  matchTitle: string;
  mapName: string;
  soloQ: boolean;
  date: Date;
  roundCount: number;
  errorCount: number;
  hitCount: number;
  totalNotes: number;
  avgSeverity: number;
};

export type PerformanceResult = {
  matches: MatchPerformance[];
  totals: {
    matchCount: number;
    roundCount: number;
    errorCount: number;
    hitCount: number;
    totalNotes: number;
    avgSeverity: number;
    errorRate: number;
    hitRate: number;
  };
};

export type ComparisonResult = {
  period1: PerformanceResult;
  period2: PerformanceResult;
  change: {
    matchCount: number;
    roundCount: number;
    errorCount: number;
    hitCount: number;
    totalNotes: number;
    avgSeverity: number;
    errorRate: number;
    hitRate: number;
  };
};

function buildNoteWhereInput(
  start: Date | null,
  end: Date | null,
  userId: string,
  includeShared: boolean,
  mapName?: string,
  groupId?: string,
  soloQ?: boolean,
): Prisma.NoteWhereInput {
  const matchFilter: Prisma.MatchWhereInput = {};
  if (mapName && mapName !== "all") matchFilter.mapName = mapName;
  if (groupId && groupId !== "all") matchFilter.groupId = groupId;
  if (soloQ !== undefined) matchFilter.soloQ = soloQ;

  if (includeShared) {
    const roundFilter: Prisma.RoundWhereInput = {};
    if (Object.keys(matchFilter).length > 0) {
      roundFilter.match = matchFilter;
    }
    return {
      userId,
      ...(Object.keys(roundFilter).length > 0 ? { round: roundFilter } : {}),
      ...(start || end ? { createdAt: { ...(start ? { gte: start } : {}), ...(end ? { lt: end } : {}) } } : {}),
    };
  }

  return {
    round: {
      match: {
        group: { ownerId: userId },
        ...matchFilter,
      },
    },
    ...(start || end ? { createdAt: { ...(start ? { gte: start } : {}), ...(end ? { lt: end } : {}) } } : {}),
  };
}

export async function getStatsFilters(): Promise<StatsFilters> {
  const session = await getSession();
  if (!session?.user) return { groups: [] };

  const cKey = cacheKey(session.user.id, "getStatsFilters", {});
  const cached = await cacheGet<StatsFilters>(cKey);
  if (cached) return cached;

  const [ownedGroups, sharedGroupIds] = await Promise.all([
    db.group.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.note.findMany({
      where: {
        userId: session.user.id,
        round: { match: { group: { ownerId: { not: session.user.id } } } },
      },
      select: { round: { select: { match: { select: { groupId: true } } } } },
      distinct: ["roundId"],
      take: 1000,
    }),
  ]);

  const uniqueGroupIds = [...new Set(sharedGroupIds.map((n) => n.round.match.groupId))];
  let sharedGroups: { id: string; name: string; owner: { name: string } }[] = [];
  if (uniqueGroupIds.length > 0) {
    sharedGroups = await db.group.findMany({
      where: { id: { in: uniqueGroupIds } },
      select: { id: true, name: true, owner: { select: { name: true } } },
    });
  }

  const ownedIds = new Set(ownedGroups.map((g) => g.id));
  const groups = [
    ...ownedGroups.map((g) => ({ id: g.id, name: g.name })),
    ...sharedGroups
      .filter((g) => !ownedIds.has(g.id))
      .map((g) => ({
        id: g.id,
        name: `${g.name} (${g.owner.name})`,
        ownerName: g.owner.name,
      })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const result = { groups };
  await cacheSet(cKey, result);
  return result;
}

export async function getStats(
  filter: DateFilter,
  mapName?: string,
  groupId?: string,
  includeShared = false,
  soloQ?: boolean,
): Promise<StatsResult> {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const cKey = cacheKey(session.user.id, "getStats", { filter, mapName, groupId, includeShared, soloQ });
  const cached = await cacheGet<StatsResult>(cKey);
  if (cached) return cached;

  const { start, end } = resolveDateRange(filter);
  const where = buildNoteWhereInput(start, end, session.user.id, includeShared, mapName, groupId, soloQ);

  const [severityAgg, tagAgg, totalNotes] = await Promise.all([
    db.note.groupBy({
      by: ["severity"],
      where: { ...where, type: "ERROR" },
      _count: { _all: true },
    }),
    db.errorNoteTag.groupBy({
      by: ["tagId"],
      where: { note: { ...where, type: "ERROR" } },
      _count: { _all: true },
    }),
    db.note.count({
      where: { ...where, type: "ERROR" },
      take: 1000,
    }),
  ]);

  const bySeverity = severityAgg
    .map((s) => ({ severity: s.severity, count: s._count._all }))
    .sort((a, b) => a.severity - b.severity);

  let byTag: { tagName: string; count: number }[] = [];
  if (tagAgg.length > 0) {
    const tagIds = tagAgg.map((t) => t.tagId);
    const tags = await db.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true, name: true },
    });
    const tagNameMap = new Map(tags.map((t) => [t.id, t.name]));
    byTag = tagAgg
      .map((t) => ({ tagName: tagNameMap.get(t.tagId) ?? "Unknown", count: t._count._all }))
      .sort((a, b) => b.count - a.count);
  }

  const result: StatsResult = {
    byTag,
    bySeverity,
    totalNotes,
  };

  await cacheSet(cKey, result);
  return result;
}

export async function getStatsNotes(
  filter: DateFilter,
  mapName?: string,
  groupId?: string,
  includeShared = false,
  tagName?: string,
  severity?: number,
  soloQ?: boolean,
): Promise<NoteDetail[]> {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const { start, end } = resolveDateRange(filter);
  const where = buildNoteWhereInput(start, end, session.user.id, includeShared, mapName, groupId, soloQ);

  const isUnbounded = !start && !end;
  const notes = await db.note.findMany({
    where: {
      ...where,
      ...(severity ? { severity } : {}),
      ...(tagName ? { errorTags: { some: { tag: { name: tagName } } } } : {}),
    },
    take: isUnbounded ? 1000 : undefined,
    select: {
      id: true,
      content: true,
      severity: true,
      type: true,
      createdAt: true,
      errorTags: {
        select: { tag: { select: { name: true } } },
      },
      round: {
        select: {
          roundNumber: true,
          match: {
            select: {
              title: true,
              mapName: true,
              soloQ: true,
              group: { select: { name: true, ownerId: true } },
            },
          },
        },
      },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return notes.map((n) => ({
    id: n.id,
    content: n.content,
    severity: n.severity,
    type: n.type,
    createdAt: n.createdAt,
    roundNumber: n.round.roundNumber,
    matchTitle: n.round.match.title,
    matchMap: n.round.match.mapName,
    matchSoloQ: n.round.match.soloQ,
    groupName: n.round.match.group.name,
    groupOwnerId: n.round.match.group.ownerId,
    userId: n.user.id,
    userName: n.user.name,
    tags: n.errorTags.map((et) => et.tag.name),
  }));
}

export async function getPerformance(
  filter: DateFilter,
  mapName?: string,
  groupId?: string,
  includeShared = false,
  soloQ?: boolean,
): Promise<PerformanceResult> {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const cKey = cacheKey(session.user.id, "getPerformance", { filter, mapName, groupId, includeShared, soloQ });
  const cached = await cacheGet<PerformanceResult>(cKey);
  if (cached) return cached;

  const { start, end } = resolveDateRange(filter);

  const noteDateFilter: Record<string, unknown> = {};
  if (start) noteDateFilter.gte = start;
  if (end) noteDateFilter.lt = end;

  const matchWhere: Record<string, unknown> = {};
  if (mapName && mapName !== "all") matchWhere.mapName = mapName;
  if (groupId && groupId !== "all") matchWhere.groupId = groupId;
  if (soloQ !== undefined) matchWhere.soloQ = soloQ;
  if (!includeShared) {
    matchWhere.group = { ownerId: session.user.id };
  }

  const matches = await db.match.findMany({
    where: matchWhere as Prisma.MatchWhereInput,
    select: {
      id: true,
      title: true,
      mapName: true,
      soloQ: true,
      createdAt: true,
      _count: { select: { rounds: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  matches.reverse();

  if (matches.length === 0) {
    const empty: PerformanceResult = { matches: [], totals: { matchCount: 0, roundCount: 0, errorCount: 0, hitCount: 0, totalNotes: 0, avgSeverity: 0, errorRate: 0, hitRate: 0 } };
    await cacheSet(cKey, empty);
    return empty;
  }

  const matchIds = matches.map((m) => m.id);

  const notes = await db.note.findMany({
    where: {
      round: { matchId: { in: matchIds } },
      ...(includeShared ? { userId: session.user.id } : {}),
      ...(Object.keys(noteDateFilter).length > 0 ? { createdAt: noteDateFilter } : {}),
    } as Prisma.NoteWhereInput,
    take: 1000,
    select: {
      type: true,
      severity: true,
      createdAt: true,
      round: { select: { matchId: true } },
    },
  });

  const errorCountMap = new Map<string, number>();
  const hitCountMap = new Map<string, number>();
  const totalNotesMap = new Map<string, number>();
  const severitySumMap = new Map<string, number>();

  for (const note of notes) {
    const mid = note.round.matchId;
    totalNotesMap.set(mid, (totalNotesMap.get(mid) ?? 0) + 1);
    if (note.type === "ERROR") {
      errorCountMap.set(mid, (errorCountMap.get(mid) ?? 0) + 1);
      severitySumMap.set(mid, (severitySumMap.get(mid) ?? 0) + note.severity);
    } else {
      hitCountMap.set(mid, (hitCountMap.get(mid) ?? 0) + 1);
    }
  }

  let totalErrorCount = 0;
  let totalHitCount = 0;
  let totalNoteCount = 0;
  let totalRoundCount = 0;
  let totalSeveritySum = 0;

  const perfMatches: MatchPerformance[] = matches.map((match) => {
    const errorCount = errorCountMap.get(match.id) ?? 0;
    const hitCount = hitCountMap.get(match.id) ?? 0;
    const totalNotes = totalNotesMap.get(match.id) ?? 0;
    const severitySum = severitySumMap.get(match.id) ?? 0;

    totalErrorCount += errorCount;
    totalHitCount += hitCount;
    totalNoteCount += totalNotes;
    totalRoundCount += match._count.rounds;
    totalSeveritySum += errorCount > 0 ? severitySum / errorCount : 0;

    return {
      matchId: match.id,
      matchTitle: match.title,
      mapName: match.mapName,
      soloQ: match.soloQ,
      date: match.createdAt,
      roundCount: match._count.rounds,
      errorCount,
      hitCount,
      totalNotes,
      avgSeverity: errorCount > 0 ? Math.round((severitySum / errorCount) * 100) / 100 : 0,
    };
  });

  const totalMatchCount = matches.length;

  const result: PerformanceResult = {
    matches: perfMatches,
    totals: {
      matchCount: totalMatchCount,
      roundCount: totalRoundCount,
      errorCount: totalErrorCount,
      hitCount: totalHitCount,
      totalNotes: totalNoteCount,
      avgSeverity: totalMatchCount > 0 ? Math.round((totalSeveritySum / totalMatchCount) * 100) / 100 : 0,
      errorRate: totalRoundCount > 0 ? Math.round((totalErrorCount / totalRoundCount) * 10000) / 100 : 0,
      hitRate: totalNoteCount > 0 ? Math.round((totalHitCount / totalNoteCount) * 10000) / 100 : 0,
    },
  };

  await cacheSet(cKey, result);
  return result;
}

export async function getComparison(
  filter1: DateFilter,
  filter2: DateFilter,
  mapName?: string,
  groupId?: string,
  includeShared = false,
  soloQ?: boolean,
): Promise<ComparisonResult> {
  const [r1, r2] = await Promise.all([
    getPerformance(filter1, mapName, groupId, includeShared, soloQ),
    getPerformance(filter2, mapName, groupId, includeShared, soloQ),
  ]);

  const ch = (a: number, b: number) => a === 0 && b === 0 ? 0 : a === 0 ? 100 : Math.round(((b - a) / a) * 10000) / 100;

  return {
    period1: r1,
    period2: r2,
    change: {
      matchCount: ch(r1.totals.matchCount, r2.totals.matchCount),
      roundCount: ch(r1.totals.roundCount, r2.totals.roundCount),
      errorCount: ch(r1.totals.errorCount, r2.totals.errorCount),
      hitCount: ch(r1.totals.hitCount, r2.totals.hitCount),
      totalNotes: ch(r1.totals.totalNotes, r2.totals.totalNotes),
      avgSeverity: ch(r1.totals.avgSeverity, r2.totals.avgSeverity),
      errorRate: ch(r1.totals.errorRate, r2.totals.errorRate),
      hitRate: ch(r1.totals.hitRate, r2.totals.hitRate),
    },
  };
}
