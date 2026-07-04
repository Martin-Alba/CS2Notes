import { z } from "zod";

export const createCustomTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(32),
});

export type CreateCustomTagInput = z.infer<typeof createCustomTagSchema>;
