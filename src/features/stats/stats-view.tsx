"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  getStats,
  getPerformance,
  getComparison,
  getStatsNotes,
  getStatsFilters,
  type NoteDetail,
  type StatsFilters,
  type StatsResult,
  type PerformanceResult,
  type ComparisonResult,
} from "./actions";
import {
  type DateFilter,
  type PresetPeriod,
} from "./utils";
import { COMPETITIVE_MAPS, SEVERITY_LABEL } from "@/lib/constants";
import dynamic from "next/dynamic";

const DonutChart = dynamic(() => import("@/components/donut-chart").then((m) => ({ default: m.DonutChart })), {
  loading: () => <div className="h-48 animate-pulse rounded-lg bg-white/[0.03]" />,
});
const StatsNotesPanel = dynamic(() => import("./stats-notes-panel").then((m) => ({ default: m.StatsNotesPanel })));

import { Skeleton } from "@/components/skeleton";
import { Collapsible } from "@/components/collapsible";

const SEVERITY_COLORS: Record<number, string> = { 1: "#22c55e", 2: "#eab308", 3: "#ef4444" };

const TAG_COLORS = [
  "#6366f1", "#f59e0b", "#06b6d4", "#ec4899", "#10b981",
  "#f97316", "#8b5cf6", "#14b8a6", "#e11d48", "#84cc16",
];

function currentYear() { return new Date().getFullYear(); }
function yearsRange() { const y = currentYear(); return Array.from({ length: y - 2019 }, (_, i) => y - i); }

type PeriodMode = "preset" | "year" | "month" | "week" | "day";

export function StatsView() {
  const t = useTranslations("stats");
  const tNotes = useTranslations("notes");
  const tCommon = useTranslations("common");

  const [periodMode, setPeriodMode] = useState<PeriodMode>("preset");
  const [preset, setPreset] = useState<PresetPeriod>("30d");
  const [specificYear, setSpecificYear] = useState(currentYear());
  const [specificMonth, setSpecificMonth] = useState(new Date().getMonth() + 1);
  const [specificWeek, setSpecificWeek] = useState("");
  const [specificDay, setSpecificDay] = useState("");
  const [mapName, setMapName] = useState("all");
  const [groupId, setGroupId] = useState("all");
  const [includeShared, setIncludeShared] = useState(false);
  const [soloQ, setSoloQ] = useState<boolean | undefined>(undefined);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePeriodMode, setComparePeriodMode] = useState<PeriodMode>("preset");
  const [comparePreset, setComparePreset] = useState<PresetPeriod>("7d");
  const [compareYear, setCompareYear] = useState(currentYear());
  const [compareMonth, setCompareMonth] = useState(new Date().getMonth() + 1);
  const [compareWeek, setCompareWeek] = useState("");
  const [compareDay, setCompareDay] = useState("");

  const [filters, setFilters] = useState<StatsFilters | null>(null);
  const [data, setData] = useState<StatsResult | null>(null);
  const [perf, setPerf] = useState<PerformanceResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelNotes, setPanelNotes] = useState<NoteDetail[] | null>(null);
  const [panelTitle, setPanelTitle] = useState("");

  const fetchAll = async (overrides?: {
    soloQ?: boolean | undefined;
    mapName?: string;
    groupId?: string;
    includeShared?: boolean;
    compareMode?: boolean;
  }) => {
    setLoading(true);
    try {
      const f = currentFilter();
      const soloQVal = overrides !== undefined && "soloQ" in overrides ? overrides.soloQ : soloQ;
      const mapNameVal = overrides !== undefined && "mapName" in overrides ? overrides.mapName : mapName;
      const groupIdVal = overrides !== undefined && "groupId" in overrides ? overrides.groupId : groupId;
      const includeSharedVal = overrides !== undefined && "includeShared" in overrides ? overrides.includeShared : includeShared;
      const compareModeVal = overrides !== undefined && "compareMode" in overrides ? overrides.compareMode : compareMode;
      const [s, p] = await Promise.all([
        getStats(f, mapNameVal, groupIdVal, includeSharedVal, soloQVal),
        getPerformance(f, mapNameVal, groupIdVal, includeSharedVal, soloQVal),
      ]);
      setData(s);
      setPerf(p);
      if (compareModeVal) {
        const c = await getComparison(f, compareFilter(), mapNameVal, groupIdVal, includeSharedVal, soloQVal);
        setComparison(c);
      } else {
        setComparison(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [flt, s, p] = await Promise.all([
        getStatsFilters(),
        getStats({ preset: "30d" }),
        getPerformance({ preset: "30d" }),
      ]);
      if (!mounted) return;
      setFilters(flt);
      setData(s);
      setPerf(p);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  function buildFilter(p: PresetPeriod, mode: PeriodMode, yr: number, mo: number, wk: string, dy: string): DateFilter {
    const base: DateFilter = { preset: p };
    if (mode === "year") base.year = yr;
    if (mode === "month") { base.year = yr; base.month = mo; }
    if (mode === "week") base.week = wk;
    if (mode === "day") base.day = dy;
    return base;
  }

  function currentFilter() { return buildFilter(preset, periodMode, specificYear, specificMonth, specificWeek, specificDay); }
  function compareFilter() { return buildFilter(comparePreset, comparePeriodMode, compareYear, compareMonth, compareWeek, compareDay); }

  const openTagNotes = async (tagName: string) => {
    setPanelTitle(`${t("tag")}: ${tagName}`);
    const notes = await getStatsNotes(currentFilter(), mapName, groupId, includeShared, tagName, undefined, soloQ);
    setPanelNotes(notes);
  };

  const openSeverityNotes = async (sev: number) => {
    const label = tNotes(`severity.${SEVERITY_LABEL[sev]}`);
    setPanelTitle(`${t("severity")}: ${label}`);
    const notes = await getStatsNotes(currentFilter(), mapName, groupId, includeShared, undefined, sev, soloQ);
    setPanelNotes(notes);
  };

  function renderSelect(allLabel: string, options: { value: string; label: string }[], value: string, onChange: (v: string) => void) {
    return (
      <div className="relative h-9">
        <select
          value={value}
          onChange={(e) => { onChange(e.target.value); }}
          className="glass-input h-full w-full appearance-none rounded-lg px-3 pr-7 text-sm text-zinc-200"
        >
          <option value="all">{allLabel}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    );
  }

  function renderPeriodSelector(props: { mode: PeriodMode; preset: PresetPeriod; year: number; month: number; week: string; day: string; onMode: (m: PeriodMode) => void; onPreset: (p: PresetPeriod) => void; onYear: (y: number) => void; onMonth: (m: number) => void; onWeek: (w: string) => void; onDay: (d: string) => void }) {
    const baseBtn = (active: boolean) =>
      `h-9 rounded-lg px-3 text-sm font-medium transition-colors ${active ? "border-cs2-orange/50 bg-cs2-orange/10 text-cs2-orange glow-orange" : "glass-btn text-zinc-400"}`;

    return (
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button onClick={() => { props.onMode("preset"); props.onPreset("24h"); setTimeout(fetchAll); }} className={baseBtn(props.mode === "preset" && props.preset === "24h")}>24h</button>
        <button onClick={() => { props.onMode("preset"); props.onPreset("7d"); setTimeout(fetchAll); }} className={baseBtn(props.mode === "preset" && props.preset === "7d")}>7d</button>
        <button onClick={() => { props.onMode("preset"); props.onPreset("30d"); setTimeout(fetchAll); }} className={baseBtn(props.mode === "preset" && props.preset === "30d")}>30d</button>
        <button onClick={() => { props.onMode("preset"); props.onPreset("12m"); setTimeout(fetchAll); }} className={baseBtn(props.mode === "preset" && props.preset === "12m")}>12m</button>
        <button onClick={() => { props.onMode("preset"); props.onPreset("all"); setTimeout(fetchAll); }} className={baseBtn(props.mode === "preset" && props.preset === "all")}>{t("all")}</button>

        <div className="h-5 w-px bg-white/10" />

        <span className="text-xs text-zinc-500">|</span>

        <button onClick={() => { props.onMode("year"); setTimeout(fetchAll); }} className={baseBtn(props.mode === "year")}>{t("yearly")}</button>
        <button onClick={() => { props.onMode("month"); setTimeout(fetchAll); }} className={baseBtn(props.mode === "month")}>{t("monthly")}</button>
        <button onClick={() => { props.onMode("week"); setTimeout(fetchAll); }} className={baseBtn(props.mode === "week")}>{t("weekly")}</button>
        <button onClick={() => { props.onMode("day"); setTimeout(fetchAll); }} className={baseBtn(props.mode === "day")}>{t("daily")}</button>

        {props.mode === "year" && (
          <select value={props.year} onChange={(e) => { props.onYear(Number(e.target.value)); setTimeout(fetchAll); }} className="glass-input h-9 rounded-lg px-2 text-sm text-zinc-200">
            {yearsRange().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {props.mode === "month" && (
          <>
            <select value={props.year} onChange={(e) => { props.onYear(Number(e.target.value)); setTimeout(fetchAll); }} className="glass-input h-9 rounded-lg px-2 text-sm text-zinc-200">
              {yearsRange().map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={props.month} onChange={(e) => { props.onMonth(Number(e.target.value)); setTimeout(fetchAll); }} className="glass-input h-9 rounded-lg px-2 text-sm text-zinc-200">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString("default", { month: "short" })}</option>)}
            </select>
          </>
        )}
        {props.mode === "week" && (
          <input type="week" value={props.week} onChange={(e) => { props.onWeek(e.target.value); setTimeout(fetchAll); }} className="glass-input h-9 rounded-lg px-2 text-sm text-zinc-200 [color-scheme:dark]" />
        )}
        {props.mode === "day" && (
          <input type="date" value={props.day} onChange={(e) => { props.onDay(e.target.value); setTimeout(fetchAll); }} className="glass-input h-9 rounded-lg px-2 text-sm text-zinc-200 [color-scheme:dark]" />
        )}
      </div>
    );
  }

  const filterBar = (
    <div className="space-y-3">
      {renderPeriodSelector({
        mode: periodMode,
        preset,
        year: specificYear,
        month: specificMonth,
        week: specificWeek,
        day: specificDay,
        onMode: setPeriodMode,
        onPreset: setPreset,
        onYear: setSpecificYear,
        onMonth: setSpecificMonth,
        onWeek: setSpecificWeek,
        onDay: setSpecificDay,
      })}

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {renderSelect(t("allMaps"), COMPETITIVE_MAPS.map((m) => ({ value: m, label: m })), mapName, (v) => { setMapName(v); fetchAll({ mapName: v }); })}
        {filters !== null ? renderSelect(t("allGroups"), filters.groups.map((g) => ({ value: g.id, label: g.name })), groupId, (v) => { setGroupId(v); fetchAll({ groupId: v }); }) : (
          <div className="relative h-9">
            <select disabled className="glass-input h-full w-full appearance-none rounded-lg px-3 pr-7 text-sm text-zinc-500">
              <option>{tCommon("loading")}</option>
            </select>
          </div>
        )}

        <button
          onClick={() => { const next = !includeShared; setIncludeShared(next); fetchAll({ includeShared: next }); }}
          className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${includeShared ? "border-cs2-orange/50 bg-cs2-orange/10 text-cs2-orange glow-orange" : "glass-btn text-zinc-400"}`}
        >
          {t("shared")}
        </button>

        <div className="flex overflow-hidden rounded-lg border border-white/10 text-sm">
          <button
            onClick={() => { setSoloQ(undefined); fetchAll({ soloQ: undefined }); }}
            className={`h-9 px-3 font-medium transition-colors ${soloQ === undefined ? "border-cs2-orange/50 bg-cs2-orange/10 text-cs2-orange glow-orange" : "glass-btn text-zinc-400"}`}
          >
            {t("anySoloQ")}
          </button>
          <button
            onClick={() => { const next = soloQ === true ? undefined : true; setSoloQ(next); fetchAll({ soloQ: next }); }}
            className={`h-9 px-3 font-medium transition-colors ${soloQ === true ? "border-cs2-orange/50 bg-cs2-orange/10 text-cs2-orange glow-orange" : "glass-btn text-zinc-400"}`}
          >
            SoloQ
          </button>
          <button
            onClick={() => { const next = soloQ === false ? undefined : false; setSoloQ(next); fetchAll({ soloQ: next }); }}
            className={`h-9 px-3 font-medium transition-colors ${soloQ === false ? "border-cs2-orange/50 bg-cs2-orange/10 text-cs2-orange glow-orange" : "glass-btn text-zinc-400"}`}
          >
            Stack
          </button>
        </div>

        <button
          onClick={() => { const next = !compareMode; setCompareMode(next); fetchAll({ compareMode: next }); }}
          className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${compareMode ? "border-cs2-orange/50 bg-cs2-orange/10 text-cs2-orange glow-orange" : "glass-btn text-zinc-400"}`}
        >
          {t("compare")}
        </button>
      </div>

      {compareMode && (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="mb-2 text-xs font-medium text-zinc-400">{t("compareWith")}</p>
          {renderPeriodSelector({
            mode: comparePeriodMode,
            preset: comparePreset,
            year: compareYear,
            month: compareMonth,
            week: compareWeek,
            day: compareDay,
            onMode: setComparePeriodMode,
            onPreset: setComparePreset,
            onYear: setCompareYear,
            onMonth: setCompareMonth,
            onWeek: setCompareWeek,
            onDay: setCompareDay,
          })}
        </div>
      )}
    </div>
  );

  function MetricCard({ label, current, previous, change, good, format }: { label: string; current: string | number; previous?: string | number; change?: number; good?: "up" | "down"; format?: (v: number) => string }) {
    const fmt = format ?? ((v: number) => String(v));
    const ch = change ?? 0;
    const isGood = good === "up" ? ch > 0 : good === "down" ? ch < 0 : true;
    const neutral = ch === 0;
    return (
      <div className="glass-card rounded-lg p-4">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-zinc-100">{typeof current === "number" ? fmt(current) : current}</p>
        {previous !== undefined && change !== undefined && (
          <p className={`mt-1 text-xs ${neutral ? "text-zinc-500" : isGood ? "text-green-400" : "text-red-400"}`}>
            {previous} ({ch > 0 ? "+" : ""}{ch}%)
          </p>
        )}
      </div>
    );
  }

  function renderPerfCards(p: PerformanceResult, comparisonChange?: ComparisonResult["change"]) {
    const ch = comparisonChange;
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard label={t("matches")} current={p.totals.matchCount} previous={ch?.matchCount} change={ch?.matchCount} />
        <MetricCard label={t("rounds")} current={p.totals.roundCount} previous={ch?.roundCount} change={ch?.roundCount} />
        <MetricCard label={t("totalErrors")} current={p.totals.errorCount} previous={ch?.errorCount} change={ch?.errorCount} good="down" />
        <MetricCard label={t("totalHits")} current={p.totals.hitCount} previous={ch?.hitCount} change={ch?.hitCount} good="up" />
        <MetricCard label={t("errorRate")} current={`${p.totals.errorRate}%`} previous={ch ? `${ch.errorRate}%` : undefined} change={ch?.errorRate} good="down" format={(v) => `${v}%`} />
        <MetricCard label={t("hitRate")} current={`${p.totals.hitRate}%`} previous={ch ? `${ch.hitRate}%` : undefined} change={ch?.hitRate} good="up" format={(v) => `${v}%`} />
        <MetricCard label={t("avgSeverity")} current={p.totals.avgSeverity} previous={ch?.avgSeverity} change={ch?.avgSeverity} good="down" />
        <MetricCard label={t("totalNotes")} current={p.totals.totalNotes} previous={ch?.totalNotes} change={ch?.totalNotes} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {filterBar}
        <p className="animate-pulse text-center text-sm text-zinc-500">{t("calculating")}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-lg p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-8 w-12" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card rounded-lg p-5">
            <Skeleton className="mb-3 h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
          <div className="glass-card rounded-lg p-5">
            <Skeleton className="mb-3 h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !perf) return null;

  return (
    <div className="space-y-6 md:space-y-8">
      {filterBar}

      {perf.totals.matchCount < 3 ? (
        <div className="glass-card rounded-lg p-6 text-center">
          <p className="text-sm text-zinc-400">{t("minMatches")}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cs2-orange/60 to-cs2-orange transition-all duration-500"
                style={{ width: `${Math.min((perf.totals.matchCount / 3) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-zinc-300">{perf.totals.matchCount}/3</span>
          </div>
        </div>
      ) : (
        <>
          {renderPerfCards(perf, comparison?.change)}

          {compareMode && comparison && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-3 text-xs font-medium text-zinc-400">{t("period1")}</p>
                {renderPerfCards(comparison.period1)}
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-3 text-xs font-medium text-zinc-400">{t("period2")}</p>
                {renderPerfCards(comparison.period2)}
              </div>
            </div>
          )}

          {perf.matches.length > 0 && (
            <Collapsible title={t("perMatch")} count={perf.matches.length}>
              <div className="space-y-1">
                {perf.matches.map((m) => (
                  <div key={m.matchId} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/[0.02]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium text-zinc-200">{m.matchTitle}</span>
                      <span className="shrink-0 text-zinc-500">{m.mapName}</span>
                      {m.soloQ && <span className="shrink-0 rounded bg-cs2-orange/10 px-1.5 py-0.5 text-[10px] font-medium text-cs2-orange">SoloQ</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-500">
                      <span title={t("rounds")}>{m.roundCount}r</span>
                      <span className="text-red-400" title={t("totalErrors")}>{m.errorCount}E</span>
                      <span className="text-green-400" title={t("totalHits")}>{m.hitCount}H</span>
                      {m.totalNotes > 0 && <span className={m.hitCount / m.totalNotes >= 0.5 ? "text-green-400" : "text-red-400"}>
                        {Math.round(m.hitCount / m.totalNotes * 100)}%
                      </span>}
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}
        </>
      )}

      {data.totalNotes === 0 ? (
        <p className="text-sm text-zinc-500">{t("noData")}</p>
      ) : (
        <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2">
          <div className="glass-card rounded-lg p-5 flex flex-col">
            <h2 className="font-heading mb-3 text-lg font-semibold tracking-wide">{t("byTag")}</h2>
            {data.byTag.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("noData")}</p>
            ) : (
              <>
                <DonutChart
                  segments={data.byTag.map((row, i) => ({
                    label: row.tagName,
                    value: row.count,
                    color: TAG_COLORS[i % TAG_COLORS.length],
                  }))}
                />
                <div className="mt-auto pt-4">
                  <Collapsible title={t("byTag")} count={data.byTag.length}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left">
                          <th className="pb-2 font-medium">{t("tag")}</th>
                          <th className="pb-2 text-right font-medium">{t("errors")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.byTag.map((row) => (
                          <tr
                            key={row.tagName}
                            className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5 last:border-0"
                            onClick={() => openTagNotes(row.tagName)}
                          >
                            <td className="py-2">{row.tagName}</td>
                            <td className="py-2 text-right">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Collapsible>
                </div>
              </>
            )}
          </div>

          <div className="glass-card rounded-lg p-5 flex flex-col">
            <h2 className="font-heading mb-3 text-lg font-semibold tracking-wide">{t("bySeverity")}</h2>
            {data.bySeverity.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("noData")}</p>
            ) : (
              <>
                <DonutChart
                  segments={data.bySeverity.map((row) => ({
                    label: SEVERITY_LABEL[row.severity],
                    value: row.count,
                    color: SEVERITY_COLORS[row.severity],
                  }))}
                />
                <div className="mt-auto pt-4">
                  <Collapsible title={t("bySeverity")} count={data.bySeverity.length}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left">
                          <th className="pb-2 font-medium">{t("severity")}</th>
                          <th className="pb-2 text-right font-medium">{t("errors")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.bySeverity.map((row) => (
                          <tr
                            key={row.severity}
                            className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5 last:border-0"
                            onClick={() => openSeverityNotes(row.severity)}
                          >
                            <td className="py-2 capitalize">{tNotes(`severity.${SEVERITY_LABEL[row.severity]}`)}</td>
                            <td className="py-2 text-right">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Collapsible>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {panelNotes && (
        <StatsNotesPanel
          notes={panelNotes}
          title={panelTitle}
          onClose={() => setPanelNotes(null)}
        />
      )}
    </div>
  );
}
