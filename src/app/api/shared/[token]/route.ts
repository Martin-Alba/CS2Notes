import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const ip = (await headers()).get("x-forwarded-for") ?? "anonymous";
  const { success } = await rateLimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const shareLink = await db.shareLink.findUnique({
    where: { token },
    select: { id: true, resourceType: true, resourceId: true },
  });
  if (!shareLink) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (shareLink.resourceType === "GROUP") {
    const group = await db.group.findUnique({
      where: { id: shareLink.resourceId },
      select: {
        id: true,
        name: true,
        description: true,
        owner: { select: { name: true } },
        _count: { select: { matches: true } },
      },
    });
    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ resourceType: "GROUP", ...group });
  }

  if (shareLink.resourceType === "MATCH") {
    const match = await db.match.findUnique({
      where: { id: shareLink.resourceId },
      select: {
        id: true,
        title: true,
        mapName: true,
        group: { select: { name: true } },
        rounds: {
          select: {
            roundNumber: true,
            notes: {
              select: {
                content: true,
                severity: true,
                type: true,
                user: { select: { name: true } },
                errorTags: { select: { tag: { select: { name: true } } } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    });
    if (!match) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ resourceType: "MATCH", ...match });
  }

  return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
}
