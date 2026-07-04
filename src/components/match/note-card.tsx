"use client";

import { type ReactNode } from "react";
import { getUserColor } from "@/lib/user-colors";

type NoteCardProps = {
  userId: string;
  userName: string;
  content: string;
  severity: number;
  type: "ERROR" | "HIT";
  tags?: { id: string; name: string }[];
  actions?: ReactNode;
};

const SEVERITY_COLORS: Record<number, string> = {
  1: "bg-green-500/10 text-green-400",
  2: "bg-yellow-500/10 text-yellow-400",
  3: "bg-red-500/10 text-red-400",
};

export function NoteCard({
  userId,
  userName,
  content,
  severity,
  type,
  tags,
  actions,
}: NoteCardProps) {
  const color = getUserColor(userId);

  return (
    <div
      className={`rounded-md border p-3 ${color.bg} ${color.border}`}
      style={{ boxShadow: `0 0 16px ${color.glow}` }}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${color.dot}`} />
            <p className="text-sm">{content}</p>
          </div>
          <p className={`mt-0.5 text-[10px] ${color.text}`}>{userName}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {type === "HIT" ? (
            <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-400">HIT</span>
          ) : (
            <>
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-400">ERROR</span>
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${SEVERITY_COLORS[severity] ?? ""}`}>
                {severity}
              </span>
            </>
          )}
          {actions}
        </div>
      </div>
      {tags && tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="glass-btn rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
