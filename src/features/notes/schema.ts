import { z } from "zod";
import { NoteType } from "@/generated/prisma/enums";

export const addNoteSchema = z.object({
  content: z.string().min(1, "Content is required").max(500),
  severity: z.number().int().min(1).max(3),
  type: z.nativeEnum(NoteType).default("ERROR"),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1).max(500).optional(),
  severity: z.number().int().min(1).max(3).optional(),
  type: z.nativeEnum(NoteType).optional(),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
