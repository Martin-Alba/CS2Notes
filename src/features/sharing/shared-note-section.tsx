"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { addNote, deleteNote, updateNote } from "@/features/notes/actions";
import { getUserColor } from "@/lib/user-colors";

type SharedNote = {
  id: string;
  content: string;
  severity: number;
  type: "ERROR" | "HIT";
  user: { id: string; name: string };
  errorTags: { tag: { id: string; name: string } }[];
};

export function SharedNoteSection({
  roundId,
  roundNumber,
  initialNotes,
  userId,
  userName,
}: {
  roundId: string;
  roundNumber: number;
  initialNotes: SharedNote[];
  userId: string;
  userName: string;
}) {
  const t = useTranslations();
  const [notes, setNotes] = useState<SharedNote[]>(initialNotes);
  const [sectionsOpen, setSectionsOpen] = useState<{ miss: boolean; hit: boolean }>({ miss: true, hit: true });
  const [input, setInput] = useState("");
  const [severity, setSeverity] = useState(1);
  const [noteType, setNoteType] = useState<"ERROR" | "HIT">("ERROR");
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSeverity, setEditSeverity] = useState(1);
  const [editType, setEditType] = useState<"ERROR" | "HIT">("ERROR");

  const handleAdd = async () => {
    const content = input.trim();
    if (!content) return;

    const optimisticNote = {
      id: crypto.randomUUID(),
      content,
      severity: noteType === "HIT" ? 1 : severity,
      type: noteType,
      user: { id: userId, name: userName },
      errorTags: [] as { tag: { id: string; name: string } }[],
    };

    setNotes((prev) => [...prev, optimisticNote]);
    setInput("");

    try {
      const note = await addNote(roundId, content, noteType === "HIT" ? 1 : severity, noteType);
      setNotes((prev) =>
        prev.map((n) => (n.id === optimisticNote.id ? { ...n, id: note.id } : n))
      );
    } catch {
      setNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id));
    }
  };

  const handleDelete = async (noteId: string) => {
    const prev = [...notes];
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    try {
      await deleteNote(noteId);
    } catch {
      setNotes(prev);
    }
  };

  const handleStartEdit = (note: SharedNote) => {
    setEditing(note.id);
    setEditContent(note.content);
    setEditSeverity(note.severity);
    setEditType(note.type);
  };

  const handleSaveEdit = async (noteId: string) => {
    const content = editContent.trim();
    if (!content) return;
    const updateData: { content: string; severity?: number; type?: "ERROR" | "HIT" } = { content, type: editType };
    if (editType === "ERROR") updateData.severity = editSeverity;

    const prev = notes.map((n) => ({ ...n }));

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, content, severity: editType === "ERROR" ? editSeverity : n.severity, type: editType } : n
      )
    );
    setEditing(null);

    try {
      await updateNote(noteId, updateData);
    } catch {
      setNotes(prev);
    }
  };

  const handleCancelEdit = () => setEditing(null);

  function renderNote(note: SharedNote) {
    const color = getUserColor(note.user.id);
    const isOwn = note.user.id === userId;
    return (
      <div
        key={note.id}
        className={`rounded-md border p-3 ${color.bg} ${color.border}`}
        style={{ boxShadow: `0 0 16px ${color.glow}` }}
      >
        {editing === note.id ? (
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
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                    note.severity === 3
                      ? "bg-red-500/10 text-red-400"
                      : note.severity === 2
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-green-500/10 text-green-400"
                  }`}>
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
                  onClick={() => handleDelete(note.id)}
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

  const errorNotes = notes.filter((n) => n.type === "ERROR");
  const hitNotes = notes.filter((n) => n.type === "HIT");

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">
        {t("matches.round")} {roundNumber}
      </h3>

      {notes.length === 0 && (
        <p className="mb-2 text-sm text-zinc-400">{t("notes.noNotes")}</p>
      )}

      {errorNotes.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setSectionsOpen((prev) => ({ ...prev, miss: !prev.miss }))}
            className="flex w-full items-center gap-2 text-xs font-medium text-red-400"
          >
            <svg className={`h-3 w-3 transition-transform ${sectionsOpen.miss ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
            {t("notes.error")} ({errorNotes.length})
          </button>
          {sectionsOpen.miss && (
            <div className="mt-2 space-y-2">
              {errorNotes.map((note) => renderNote(note))}
            </div>
          )}
        </div>
      )}

      {hitNotes.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setSectionsOpen((prev) => ({ ...prev, hit: !prev.hit }))}
            className="flex w-full items-center gap-2 text-xs font-medium text-green-400"
          >
            <svg className={`h-3 w-3 transition-transform ${sectionsOpen.hit ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
            {t("notes.hit")} ({hitNotes.length})
          </button>
          {sectionsOpen.hit && (
            <div className="mt-2 space-y-2">
              {hitNotes.map((note) => renderNote(note))}
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setNoteType("ERROR")}
            className={`px-2 py-1.5 transition-colors ${noteType === "ERROR" ? "bg-red-500/15 text-red-300" : "bg-white/[0.03] text-zinc-500"}`}
          >
            {t("notes.error")}
          </button>
          <button
            onClick={() => setNoteType("HIT")}
            className={`px-2 py-1.5 transition-colors ${noteType === "HIT" ? "bg-green-500/15 text-green-300" : "bg-white/[0.03] text-zinc-500"}`}
          >
            {t("notes.hit")}
          </button>
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("notes.notePlaceholder")}
          className="glass-input min-w-0 flex-1 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        {noteType === "ERROR" && (
        <select
          value={severity}
          onChange={(e) => setSeverity(Number(e.target.value))}
          className="glass-input rounded-lg px-2 py-1.5 text-sm text-zinc-200"
        >
          <option value={1}>{t("notes.severity.low")}</option>
          <option value={2}>{t("notes.severity.medium")}</option>
          <option value={3}>{t("notes.severity.high")}</option>
        </select>
        )}
        <button
          onClick={handleAdd}
          className="glass-btn rounded-lg border border-cs2-orange/30 bg-cs2-orange/10 px-3 py-1.5 text-sm text-cs2-orange hover:bg-cs2-orange/20 glow-orange"
        >
          {t("notes.addNote")}
        </button>
      </div>
    </div>
  );
}
