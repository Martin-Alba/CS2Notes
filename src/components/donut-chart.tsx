export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

export function DonutChart({
  segments,
  size = 180,
  thickness = 36,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const parts = segments.filter((s) => s.value > 0);

  const arcs = parts.reduce<{ seg: DonutSegment; pct: number; length: number; offset: number }[]>((acc, seg) => {
    const pct = seg.value / total;
    const length = pct * circumference;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].length : 0;
    acc.push({ seg, pct, length, offset });
    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {arcs.map(({ seg, length, offset }) => (
              <circle
                key={seg.label}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                className="drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]"
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-bold text-zinc-100">{total}</span>
          <span className="font-heading text-xs text-zinc-500">total</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {arcs.map(({ seg, pct }) => (
          <div
            key={seg.label}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs backdrop-blur-sm"
            style={{
              boxShadow: `0 0 8px ${seg.color}40`,
              borderColor: `${seg.color}33`,
            }}
          >
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: seg.color,
                boxShadow: `0 0 6px ${seg.color}80`,
              }}
            />
            <span className="text-zinc-400">{seg.label}</span>
            <span className="font-medium text-zinc-100">
              {(pct * 100).toFixed(1)}%
            </span>
            <span className="text-zinc-500">({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
