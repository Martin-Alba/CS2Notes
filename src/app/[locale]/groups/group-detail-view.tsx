"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateGroup, deleteGroup } from "@/features/groups/actions";
import { updateMatch, deleteMatch } from "@/features/matches/actions";
import { CreateMatchForm } from "@/features/matches/create-match-form";
import { ShareLinkButton } from "@/features/sharing/share-link-button";
import Link from "next/link";
import { COMPETITIVE_MAPS } from "@/lib/constants";

type MatchItem = {
  id: string;
  title: string;
  mapName: string;
  soloQ: boolean;
  createdAt: Date;
};

type GroupItem = {
  id: string;
  name: string;
  description: string | null;
  matches: MatchItem[];
};

export function GroupDetailView({ group }: { group: GroupItem }) {
  const t = useTranslations();
  const router = useRouter();

  const [editingGroup, setEditingGroup] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [groupDesc, setGroupDesc] = useState(group.description ?? "");

  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [matchTitle, setMatchTitle] = useState("");
  const [matchMap, setMatchMap] = useState("");
  const [matchSoloQ, setMatchSoloQ] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSaveGroup = async () => {
    const fd = new FormData();
    fd.set("name", groupName);
    fd.set("description", groupDesc);
    await updateGroup(group.id, fd);
    setEditingGroup(false);
  };

  const handleDeleteGroup = async () => {
    await deleteGroup(group.id);
    router.push("/groups");
  };

  const handleSaveMatch = async (matchId: string) => {
    const fd = new FormData();
    fd.set("title", matchTitle);
    fd.set("mapName", matchMap);
    fd.set("soloQ", matchSoloQ ? "true" : "false");
    await updateMatch(matchId, fd);
    setEditingMatch(null);
  };

  const handleDeleteMatch = async (matchId: string) => {
    await deleteMatch(matchId);
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <Link href="/groups" className="text-sm text-zinc-500 transition-colors hover:text-cs2-orange">
            &larr; {t("groups.title")}
          </Link>

          {editingGroup ? (
            <div className="mt-2 space-y-2">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="glass-input w-full rounded-lg px-3 py-1.5 text-lg font-bold text-zinc-200"
              />
              <input
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder={t("groups.description")}
                className="glass-input w-full rounded-lg px-3 py-1.5 text-sm text-zinc-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveGroup}
                  className="glass-btn rounded-lg border border-cs2-orange/30 bg-cs2-orange/10 px-3 py-1.5 text-sm text-cs2-orange hover:bg-cs2-orange/20 glow-orange"
                >
                  {t("common.save")}
                </button>
                <button
                  onClick={() => {
                    setEditingGroup(false);
                    setGroupName(group.name);
                    setGroupDesc(group.description ?? "");
                  }}
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">{group.name}</h1>
                {group.description && (
                  <p className="text-zinc-500">{group.description}</p>
                )}
              </div>
              <button
                onClick={() => setEditingGroup(true)}
                className="shrink-0 text-sm text-zinc-500 transition-colors hover:text-cs2-orange"
              >
                {t("common.edit")}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ShareLinkButton resourceType="GROUP" resourceId={group.id} />
          <CreateMatchForm groupId={group.id} />
          <button
            onClick={() => setDeleting("group")}
            className="glass-btn rounded-lg border border-cs2-red/30 bg-cs2-red/10 px-3 py-1.5 text-sm text-cs2-red hover:bg-cs2-red/20 glow-red"
          >
            {t("common.delete")}
          </button>
        </div>
      </div>

      {deleting === "group" && (
        <div className="glass-card rounded-lg border border-cs2-red/30 bg-cs2-red/10 p-4">
          <p className="mb-2 text-sm text-cs2-red">
            {t("groups.deleteConfirm")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteGroup}
              className="glass-btn rounded-lg border border-cs2-red/30 bg-cs2-red/20 px-3 py-1.5 text-sm text-cs2-red hover:bg-cs2-red/30 glow-red"
            >
              {t("common.delete")}
            </button>
            <button
              onClick={() => setDeleting(null)}
                className="glass-btn rounded-lg px-3 py-1.5 text-sm text-zinc-400"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {group.matches.length === 0 ? (
        <p className="text-zinc-500">{t("matches.noMatches")}</p>
      ) : (
        <div className="space-y-2">
          {group.matches.map((match) => (
            <div
              key={match.id}
              className="glass flex items-center justify-between rounded-lg p-4 transition-all hover:border-white/20"
            >
              {editingMatch === match.id ? (
                <div className="flex w-full flex-wrap items-center gap-2">
                  <input
                    value={matchTitle}
                    onChange={(e) => setMatchTitle(e.target.value)}
                    className="glass-input flex-1 rounded-lg px-3 py-1.5 text-sm text-zinc-200"
                  />
                  <select
                    value={matchMap}
                    onChange={(e) => setMatchMap(e.target.value)}
                    className="glass-input rounded-lg px-2 py-1.5 text-sm text-zinc-200"
                  >
                    {COMPETITIVE_MAPS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={matchSoloQ}
                      onChange={(e) => setMatchSoloQ(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-cs2-orange accent-cs2-orange"
                    />
                    SoloQ
                  </label>
                  <button
                    onClick={() => handleSaveMatch(match.id)}
                  className="glass-btn rounded-lg border border-cs2-orange/30 bg-cs2-orange/10 px-3 py-1.5 text-sm text-cs2-orange hover:bg-cs2-orange/20 glow-orange"
                  >
                    {t("common.save")}
                  </button>
                  <button
                    onClick={() => setEditingMatch(null)}
                    className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              ) : (
                <Link href={`/match/${match.id}`} className="flex flex-1 items-center justify-between transition-opacity hover:opacity-80">
                  <div>
                    <p className="font-medium text-zinc-200">{match.title}</p>
                    <p className="flex items-center gap-2 text-sm text-zinc-500">
                      {match.mapName}
                      {match.soloQ && <span className="rounded bg-cs2-orange/10 px-1.5 py-0.5 text-[10px] font-medium text-cs2-orange">SoloQ</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingMatch(match.id);
                        setMatchTitle(match.title);
                        setMatchMap(match.mapName);
                        setMatchSoloQ(match.soloQ);
                      }}
                      className="glass-btn rounded-lg p-1 text-zinc-400 hover:text-cs2-orange"
                      title={t("common.edit")}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleting(match.id);
                      }}
                      className="glass-btn rounded-lg p-1 text-zinc-400 hover:text-cs2-red"
                      title={t("common.delete")}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {deleting && deleting !== "group" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="glass-card mx-4 w-full max-w-sm rounded-lg p-6">
            <p className="mb-4 text-sm text-zinc-200">{t("matches.deleteConfirm")}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
              className="glass-btn rounded-lg px-3 py-1.5 text-sm text-zinc-400"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => handleDeleteMatch(deleting)}
              className="glass-btn rounded-lg border border-cs2-red/30 bg-cs2-red/20 px-3 py-1.5 text-sm text-cs2-red hover:bg-cs2-red/30 glow-red"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
