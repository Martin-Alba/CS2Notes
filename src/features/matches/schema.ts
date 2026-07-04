import { z } from "zod";

export const createMatchSchema = z.object({
  title: z.string().min(1).max(128),
  mapName: z.string().min(1).max(64),
  groupId: z.string().min(1),
  soloQ: z.boolean().optional().default(false),
});

export const updateMatchSchema = z.object({
  title: z.string().min(1).max(128).optional(),
  mapName: z.string().min(1).max(64).optional(),
  soloQ: z.boolean().optional(),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
