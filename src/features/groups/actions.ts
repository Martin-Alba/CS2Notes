"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createGroupSchema, updateGroupSchema } from "./schema";

export async function getGroups() {
  const session = await getSession();
  if (!session?.user) return [];

  return db.group.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      _count: { select: { matches: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getGroup(id: string) {
  const session = await getSession();
  if (!session?.user) return null;

  return db.group.findFirst({
    where: { id, ownerId: session.user.id },
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
}

export async function createGroup(formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = createGroupSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  const existing = await db.group.findFirst({
    where: { ownerId: session.user.id, name: { equals: parsed.name, mode: "insensitive" } },
  });
  if (existing) throw new Error("A group with this name already exists");

  const group = await db.group.create({
    data: {
      id: crypto.randomUUID(),
      name: parsed.name,
      description: parsed.description,
      ownerId: session.user.id,
    },
  });

  revalidatePath("/groups");
  return group;
}

export async function updateGroup(id: string, formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = updateGroupSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  const group = await db.group.updateMany({
    where: { id, ownerId: session.user.id },
    data: parsed,
  });

  revalidatePath(`/groups/${id}`);
  revalidatePath("/groups");
  return group;
}

export async function deleteGroup(id: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  await db.group.deleteMany({
    where: { id, ownerId: session.user.id },
  });

  revalidatePath("/groups");
}
