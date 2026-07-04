import { describe, it, expect } from "vitest";
import { getUserColor, CS2_COLORS } from "@/lib/user-colors";

describe("getUserColor", () => {
  it("returns a valid color for any user ID", () => {
    const color = getUserColor("user-123");
    expect(CS2_COLORS).toContainEqual(color);
  });

  it("returns the same color for the same user ID", () => {
    const a = getUserColor("consistent-id");
    const b = getUserColor("consistent-id");
    expect(a).toBe(b);
  });

  it("distributes different IDs across colors", () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    const colors = ids.map((id) => getUserColor(id));
    const unique = new Set(colors);
    expect(unique.size).toBeGreaterThan(1);
  });
});
