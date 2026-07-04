"use client";

import { useTranslations } from "next-intl";
import { getUserColor } from "@/lib/user-colors";
import { type NoteDetail } from "./actions";

const SEVERITY_COLORS: Record<number, string> = {
  1: "bg-green-500/10 text-green-400",
  2: "bg-yellow-500/10 text-yellow-400",
  3: "bg-red-500/10 text-red-400",
};

export function StatsNotesPanel({
  notes,
  title,
  onClose,
}: {
  notes: NoteDetail[];
  title: string;
  onClose: () => void;
}) {
  const t = useTranslations("stats");
  const tNotes = useTranslations("notes");

  if (notes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-lg overflow-y-auto border-l border-white/[0.06] glass-card rounded-none p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="glass-btn rounded-lg p-1 text-zinc-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-zinc-500">
          {notes.length} {t("notes")}
        </p>

        <div className="space-y-3">
          {notes.map((note) => {
            const color = getUserColor(note.userId);
            return (
              <div
                key={note.id}
                className={`rounded-lg border p-3 ${color.bg} ${color.border}`}
                style={{ boxShadow: `0 0 16px ${color.glow}` }}
              >
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className={`inline-block h-2 w-2 rounded-full ${color.dot}`} />
                  <span className={color.text}>{note.userName}</span>
                  <span className="text-zinc-500">·</span>
                  <span>{t("round")} {note.roundNumber}</span>
                  <span className="text-zinc-500">·</span>
                  <span>{note.matchMap}</span>
                  <span className="text-zinc-500">·</span>
                  <span>{note.matchTitle}</span>
                </div>

                <p className="text-sm">{note.content}</p>

                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      note.type === "HIT" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {note.type === "HIT" ? tNotes("hit") : tNotes("error")}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_COLORS[note.severity] ?? ""}`}
                  >
                    {note.severity === 1 && tNotes("severity.low")}
                    {note.severity === 2 && tNotes("severity.medium")}
                    {note.severity === 3 && tNotes("severity.high")}
                  </span>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="glass-btn rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
