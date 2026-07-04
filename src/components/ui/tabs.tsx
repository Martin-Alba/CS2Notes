"use client";



type Tab = {
  id: string;
  label: string;
  count?: number;
};

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex overflow-x-auto rounded-lg border border-white/10 text-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors ${
            active === tab.id
              ? "border-cs2-orange/50 bg-cs2-orange/10 text-cs2-orange glow-orange"
              : "glass-btn text-zinc-400 hover:text-zinc-300"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded bg-white/10 px-1 py-0.5 text-xs">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
