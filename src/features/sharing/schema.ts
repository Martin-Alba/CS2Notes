import { z } from "zod";

export const createShareLinkSchema = z.object({
  resourceType: z.enum(["GROUP", "MATCH"]),
  resourceId: z.string().min(1),
});

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
