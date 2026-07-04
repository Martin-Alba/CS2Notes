import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { resolveDateRange } from "@/features/stats/utils";

describe("resolveDateRange", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-03T12:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("returns null bounds for 'all' preset", () => {
    const result = resolveDateRange({ preset: "all" });
    expect(result.start).toBeNull();
    expect(result.end).toBeNull();
  });

  it("returns correct range for '24h'", () => {
    const result = resolveDateRange({ preset: "24h" });
    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeNull();
    const diff = Date.now() - result.start!.getTime();
    expect(diff).toBeCloseTo(24 * 60 * 60 * 1000, -3);
  });

  it("returns correct range for '7d'", () => {
    const result = resolveDateRange({ preset: "7d" });
    expect(result.start).toBeInstanceOf(Date);
    const diff = Date.now() - result.start!.getTime();
    expect(diff).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
  });

  it("handles specific day", () => {
    const result = resolveDateRange({ preset: "all", day: "2026-07-01" });
    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeInstanceOf(Date);
    expect(result.start!.getDate()).toBe(1);
    expect(result.end!.getDate()).toBe(2);
  });

  it("handles specific year and month", () => {
    const result = resolveDateRange({ preset: "all", year: 2026, month: 6 });
    expect(result.start!.getMonth()).toBe(5); // 0-indexed
    expect(result.start!.getFullYear()).toBe(2026);
    expect(result.start!.getDate()).toBe(1);
    expect(result.end!.getMonth()).toBe(5);
  });

  it("handles '12m' accurately", () => {
    const result = resolveDateRange({ preset: "12m" });
    expect(result.start).toBeInstanceOf(Date);
    expect(result.start!.getFullYear()).toBe(2025);
    expect(result.start!.getMonth()).toBe(6); // July
  });
});
