export type PresetPeriod = "24h" | "7d" | "30d" | "12m" | "all";

export type DateFilter = {
  preset: PresetPeriod;
  year?: number;
  month?: number;
  week?: string;
  day?: string;
};

export function resolveDateRange(filter: DateFilter): { start: Date | null; end: Date | null } {
  if (filter.day) {
    const start = new Date(filter.day);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }
  if (filter.week) {
    const parts = filter.week.match(/^(\d{4})-W(\d{2})$/);
    if (parts) {
      const year = Number(parts[1]);
      const week = Number(parts[2]);
      const jan1 = new Date(year, 0, 1);
      const days = (week - 1) * 7 + (1 - jan1.getDay());
      const start = new Date(year, 0, days);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      return { start, end };
    }
  }
  if (filter.year) {
    const month = filter.month ?? 1;
    const start = new Date(filter.year, month - 1, 1);
    const end = filter.month
      ? new Date(filter.year, month, 0, 23, 59, 59, 999)
      : new Date(filter.year + 1, 0, 1);
    return { start, end };
  }
  if (filter.preset !== "all") {
    const now = new Date();
    switch (filter.preset) {
      case "24h": return { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: null };
      case "7d": return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: null };
      case "30d": return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: null };
      case "12m": { const d = new Date(now); d.setMonth(d.getMonth() - 12); return { start: d, end: null }; }
    }
  }
  return { start: null, end: null };
}
