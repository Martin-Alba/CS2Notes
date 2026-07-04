import { z } from "zod";

export const addRoundSchema = z.object({
  matchId: z.string().min(1),
});

export const deleteRoundSchema = z.object({
  roundId: z.string().min(1),
  matchId: z.string().min(1),
});

export type AddRoundInput = z.infer<typeof addRoundSchema>;
export type DeleteRoundInput = z.infer<typeof deleteRoundSchema>;
