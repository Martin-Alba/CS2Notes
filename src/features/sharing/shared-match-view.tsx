"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { addNote, deleteNote, updateNote } from "@/features/notes/actions";
import { getUserColor } from "@/lib/user-colors";
import Link from "next/link";

type SharedNote = {
  id: string;
  content: string;
  severity: number;
  type: "ERROR" | "HIT";
  user: { id: string; name: string };
  errorTags: { tag: { id: string; name: string } }[];
};

type SharedRound = {
  id: string;
  roundNumber: number;
  notes: SharedNote[];
};

type SharedMatch = {
  id: string;
  title: string;
  mapName: string;
  group: { name: string; ownerId: string };
  rounds: SharedRound[];
};

const SEVERITY_COLORS: Record<number, string> = {
  1: "bg-green-500/10 text-green-400",
  2: "bg-yellow-500/10 text-yellow-400",
  3: "bg-red-500/10 text-red-400",
};

export function SharedMatchView({
  match,
  isOwner,
  userId,
  userName,
}: {
  match: SharedMatch;
  isOwner: boolean;
  userId: string;
  userName: string;
}) {
  const t = useTranslations();
  const [rounds, setRounds] = useState<SharedRound[]>(match.rounds);
  const [roundsOpen, setRoundsOpen] = useState<Record<string, boolean>>({});
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, { miss: boolean; hit: boolean }>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [noteSeverities, setNoteSeverities] = useState<Record<string, number>>({});
  const [noteTypes, setNoteTypes] = useState<Record<string, "ERROR" | "HIT">>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSeverity, setEditSeverity] = useState(1);
  const [editType, setEditType] = useState<"ERROR" | "HIT">("ERROR");

  const handleAddNote = async (roundId: string) => {
    const content = noteInputs[roundId]?.trim();
    if (!content) return;

    const type = noteTypes[roundId] || "ERROR";
    const severity = type === "HIT" ? 1 : (noteSeverities[roundId] || 1);

    const optimisticNote = {
      id: crypto.randomUUID(),
      content,
      severity,
      type,
      user: { id: userId, name: userName },
      errorTags: [] as { tag: { id: string; name: string } }[],
    };

    setRounds((prev) =>
      prev.map((r) =>
        r.id === roundId
          ? { ...r, notes: [...r.notes, optimisticNote] }
          : r
      )
    );
    setNoteInputs((prev) => ({ ...prev, [roundId]: "" }));

    try {
      const note = await addNote(roundId, content, severity, type);
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId
            ? { ...r, notes: r.notes.map((n) => (n.id === optimisticNote.id ? { ...n, id: note.id } : n)) }
            : r
        )
      );
    } catch {
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId
            ? { ...r, notes: r.notes.filter((n) => n.id !== optimisticNote.id) }
            : r
        )
      );
    }
  };

  const handleStartEdit = (note: SharedNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
    setEditSeverity(note.severity);
    setEditType(note.type);
  };

  const handleSaveEdit = async (noteId: string) => {
    const content = editContent.trim();
    if (!content) return;
    const updateData: { content: string; severity?: number; type?: "ERROR" | "HIT" } = { content, type: editType };
    if (editType === "ERROR") updateData.severity = editSeverity;

    const prev = rounds.map((r) => ({ ...r, notes: r.notes.map((n) => ({ ...n })) }));

    setRounds((prev) =>
      prev.map((r) => ({
        ...r,
        notes: r.notes.map((n) =>
          n.id === noteId ? { ...n, content, severity: editType === "ERROR" ? editSeverity : n.severity, type: editType } : n
        ),
      }))
    );
    setEditingNote(null);

    try {
      await updateNote(noteId, updateData);
    } catch {
      setRounds(prev);
    }
  };

  const handleCancelEdit = () => setEditingNote(null);

  const handleDeleteNote = async (roundId: string, noteId: string) => {
    const prev = rounds.map((r) => ({ ...r, notes: r.notes.map((n) => ({ ...n })) }));

    setRounds((prev) =>
      prev.map((r) =>
        r.id === roundId
          ? { ...r, notes: r.notes.filter((n) => n.id !== noteId) }
          : r
      )
    );

    try {
      await deleteNote(noteId);
    } catch {
      setRounds(prev);
    }
  };

  function renderNote(note: SharedNote, roundId: string) {
    const color = getUserColor(note.user.id);
    const isOwn = note.user.id === userId;
    return (
      <div
        key={note.id}
        className={`rounded-md border p-3 ${color.bg} ${color.border}`}
        style={{ boxShadow: `0 0 16px ${color.glow}` }}
      >
        {editingNote === note.id ? (
          <div className="space-y-2">
            <input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="glass-input w-full rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs">
                <button
                  onClick={() => setEditType("ERROR")}
                  className={`px-2 py-1 transition-colors ${editType === "ERROR" ? "bg-red-500/15 text-red-300" : "bg-white/[0.03] text-zinc-500"}`}
                >
                  {t("notes.error")}
                </button>
                <button
                  onClick={() => setEditType("HIT")}
                  className={`px-2 py-1 transition-colors ${editType === "HIT" ? "bg-green-500/15 text-green-300" : "bg-white/[0.03] text-zinc-500"}`}
                >
                  {t("notes.hit")}
                </button>
              </div>
              {editType === "ERROR" && (
              <select
                value={editSeverity}
                onChange={(e) => setEditSeverity(Number(e.target.value))}
                className="glass-input rounded-lg px-2 py-1 text-sm text-zinc-200"
              >
                <option value={1}>{t("notes.severity.low")}</option>
                <option value={2}>{t("notes.severity.medium")}</option>
                <option value={3}>{t("notes.severity.high")}</option>
              </select>
              )}
              <button
                onClick={() => handleSaveEdit(note.id)}
                className="glass-btn rounded-lg border border-cs2-orange/30 bg-cs2-orange/10 px-2 py-1 text-xs text-cs2-orange hover:bg-cs2-orange/20 glow-orange"
              >
                {t("common.save")}
              </button>
              <button
                onClick={handleCancelEdit}
                className="glass-btn rounded-lg p-1 text-zinc-500 hover:text-zinc-300"
                title={t("common.cancel")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${color.dot}`} />
              <p className="text-sm">{note.content}</p>
            </div>
            <p className={`mt-0.5 text-[10px] ${color.text}`}>
              {note.user.name}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex gap-1">
              {note.type === "HIT" ? (
                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-green-400">
                  {t("notes.hit")}
                </span>
              ) : (
                <>
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-red-400">
                    {t("notes.error")}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${SEVERITY_COLORS[note.severity] ?? ""}`}>
                    {note.severity === 1 && t("notes.severity.low")}
                    {note.severity === 2 && t("notes.severity.medium")}
                    {note.severity === 3 && t("notes.severity.high")}
                  </span>
                </>
              )}
            </div>
            {isOwn && (
              <div className="flex gap-0.5">
                <button
                  onClick={() => handleStartEdit(note)}
                  className="glass-btn rounded-md p-0.5 text-zinc-500 hover:text-cs2-orange"
                  title={t("common.edit")}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  onClick={() => handleDeleteNote(roundId, note.id)}
                  className="glass-btn rounded-md p-0.5 text-zinc-500 hover:text-cs2-red"
                  title={t("common.delete")}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {note.errorTags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {note.errorTags.map((et) => (
              <span
                key={et.tag.id}
                className="glass-btn rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400"
              >
                {et.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="mb-2 text-xs text-zinc-400">
        Shared from {match.group.name}
      </div>
      <h1 className="text-2xl font-bold text-zinc-100">{match.title}</h1>
      <p className="text-sm text-zinc-500">{match.mapName}</p>

      <div className="space-y-3">
        {rounds.map((round) => {
          const isRoundOpen = roundsOpen[round.id] ?? true;
          const section = sectionsOpen[round.id] ?? { miss: true, hit: true };
          const errorNotes = round.notes.filter((n) => n.type === "ERROR");
          const hitNotes = round.notes.filter((n) => n.type === "HIT");

          return (
          <div
            key={round.id}
            className="glass-card rounded-lg p-4"
          >
            <button
              onClick={() => setRoundsOpen((prev) => ({ ...prev, [round.id]: !(prev[round.id] ?? true) }))}
              className="flex w-full items-center justify-between text-left"
            >
              <h2 className="font-semibold">
                {t("matches.round")} {round.roundNumber}
              </h2>
              <span className="flex items-center gap-2 text-xs text-zinc-400">
                {round.notes.length} note{round.notes.length !== 1 ? "s" : ""}
                <svg className={`h-4 w-4 transition-transform ${isRoundOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </button>

            {isRoundOpen && (
              <>
                {round.notes.length === 0 && (
                  <p className="mb-3 mt-3 text-sm text-zinc-400">{t("notes.noNotes")}</p>
                )}

                {errorNotes.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setSectionsOpen((prev) => ({ ...prev, [round.id]: { ...section, miss: !section.miss } }))}
                      className="flex w-full items-center gap-2 text-xs font-medium text-red-400"
                    >
                      <svg className={`h-3 w-3 transition-transform ${section.miss ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                      {t("notes.error")} ({errorNotes.length})
                    </button>
                    {section.miss && (
                      <div className="mt-2 space-y-2">
                        {errorNotes.map((note) => renderNote(note, round.id))}
                      </div>
                    )}
                  </div>
                )}

                {hitNotes.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setSectionsOpen((prev) => ({ ...prev, [round.id]: { ...section, hit: !section.hit } }))}
                      className="flex w-full items-center gap-2 text-xs font-medium text-green-400"
                    >
                      <svg className={`h-3 w-3 transition-transform ${section.hit ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                      {t("notes.hit")} ({hitNotes.length})
                    </button>
                    {section.hit && (
                      <div className="mt-2 space-y-2">
                        {hitNotes.map((note) => renderNote(note, round.id))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs">
                    <button
                      onClick={() => setNoteTypes((prev) => ({ ...prev, [round.id]: "ERROR" }))}
                      className={`px-2 py-1.5 transition-colors ${(noteTypes[round.id] || "ERROR") === "ERROR" ? "bg-red-500/15 text-red-300" : "bg-white/[0.03] text-zinc-500"}`}
                    >
                      {t("notes.error")}
                    </button>
                    <button
                      onClick={() => setNoteTypes((prev) => ({ ...prev, [round.id]: "HIT" }))}
                      className={`px-2 py-1.5 transition-colors ${noteTypes[round.id] === "HIT" ? "bg-green-500/15 text-green-300" : "bg-white/[0.03] text-zinc-500"}`}
                    >
                      {t("notes.hit")}
                    </button>
                  </div>
                  <input
                    value={noteInputs[round.id] ?? ""}
                    onChange={(e) =>
                      setNoteInputs((prev) => ({
                        ...prev,
                        [round.id]: e.target.value,
                      }))
                    }
                    placeholder={t("notes.notePlaceholder")}
                    className="glass-input min-w-0 flex-[1_1_100%] rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500 sm:flex-[1_1_0%]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNote(round.id);
                      }
                    }}
                  />
                  {(noteTypes[round.id] || "ERROR") === "ERROR" && (
                  <select
                    value={noteSeverities[round.id] ?? 1}
                    onChange={(e) =>
                      setNoteSeverities((prev) => ({
                        ...prev,
                        [round.id]: Number(e.target.value),
                      }))
                    }
                    className="glass-input rounded-lg px-2 py-1.5 text-sm text-zinc-200"
                  >
                    <option value={1}>{t("notes.severity.low")}</option>
                    <option value={2}>{t("notes.severity.medium")}</option>
                    <option value={3}>{t("notes.severity.high")}</option>
                  </select>
                  )}
                  <button
                    onClick={() => handleAddNote(round.id)}
                    className="glass-btn rounded-lg border border-cs2-orange/30 bg-cs2-orange/10 px-3 py-1.5 text-sm text-cs2-orange hover:bg-cs2-orange/20 glow-orange"
                  >
                    {t("notes.addNote")}
                  </button>
                </div>
              </>
            )}
          </div>
          );
        })}
      </div>

      {isOwner && (
        <Link
          href={`/match/${match.id}`}
          className="glass-btn inline-block rounded-lg px-4 py-2 text-sm text-zinc-300"
        >
          {t("matches.title")}
        </Link>
      )}
    </div>
  );
}
