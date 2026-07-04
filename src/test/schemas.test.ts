import { describe, it, expect } from "vitest";
import { createGroupSchema, updateGroupSchema } from "@/features/groups/schema";
import { createMatchSchema } from "@/features/matches/schema";
import { addNoteSchema } from "@/features/notes/schema";
import { addRoundSchema, deleteRoundSchema } from "@/features/rounds/schema";

describe("Group schemas", () => {
  it("validates valid create input", () => {
    const result = createGroupSchema.parse({ name: "Faceit" });
    expect(result.name).toBe("Faceit");
  });

  it("rejects empty name", () => {
    expect(() => createGroupSchema.parse({ name: "" })).toThrow();
  });

  it("rejects name > 64 chars", () => {
    expect(() => createGroupSchema.parse({ name: "x".repeat(65) })).toThrow();
  });

  it("validates update with partial data", () => {
    const result = updateGroupSchema.parse({ name: "New Name" });
    expect(result.name).toBe("New Name");
  });

  it("accepts empty update object", () => {
    const result = updateGroupSchema.parse({});
    expect(result).toEqual({});
  });
});

describe("Match schemas", () => {
  it("validates valid match", () => {
    const result = createMatchSchema.parse({
      title: "Mirage Jul-2",
      mapName: "Mirage",
      groupId: "group-1",
    });
    expect(result.title).toBe("Mirage Jul-2");
  });

  it("defaults soloQ to false", () => {
    const result = createMatchSchema.parse({
      title: "Test",
      mapName: "Dust2",
      groupId: "g-1",
    });
    expect(result.soloQ).toBe(false);
  });

  it("accepts soloQ true", () => {
    const result = createMatchSchema.parse({
      title: "Test",
      mapName: "Dust2",
      groupId: "g-1",
      soloQ: true,
    });
    expect(result.soloQ).toBe(true);
  });
});

describe("Note schemas", () => {
  it("validates valid note", () => {
    const result = addNoteSchema.parse({
      content: "Missed AWP shot",
      severity: 2,
      type: "ERROR",
    });
    expect(result.content).toBe("Missed AWP shot");
  });

  it("rejects severity > 3", () => {
    expect(() =>
      addNoteSchema.parse({ content: "test", severity: 5 })
    ).toThrow();
  });

  it("rejects empty content", () => {
    expect(() =>
      addNoteSchema.parse({ content: "", severity: 1 })
    ).toThrow();
  });

  it("defaults type to ERROR", () => {
    const result = addNoteSchema.parse({ content: "test", severity: 1 });
    expect(result.type).toBe("ERROR");
  });

  it("accepts HIT type", () => {
    const result = addNoteSchema.parse({ content: "Nice shot", severity: 1, type: "HIT" });
    expect(result.type).toBe("HIT");
  });
});

describe("Round schemas", () => {
  it("validates addRound", () => {
    const result = addRoundSchema.parse({ matchId: "match-1" });
    expect(result.matchId).toBe("match-1");
  });

  it("rejects empty matchId", () => {
    expect(() => addRoundSchema.parse({ matchId: "" })).toThrow();
  });

  it("validates deleteRound", () => {
    const result = deleteRoundSchema.parse({ roundId: "r-1", matchId: "m-1" });
    expect(result.roundId).toBe("r-1");
  });
});
