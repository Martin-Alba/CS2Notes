export const COMPETITIVE_MAPS = [
  "Ancient", "Anubis", "Cache", "Dust2",
  "Mirage", "Nuke", "Overpass", "Vertigo",
] as const;

export const SEVERITY_LABEL: Record<number, string> = {
  1: "low",
  2: "medium",
  3: "high",
};
