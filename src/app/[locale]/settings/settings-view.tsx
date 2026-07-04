"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createCustomTag, deleteCustomTag } from "@/features/tags/actions";
import { deleteShareLink } from "@/features/sharing/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { validatePassword } from "@/lib/password";
import { requestAccountDeletion } from "@/features/auth/actions";

type Tag = { id: string; name: string; type: string };
type ShareLink = { id: string; token: string; resourceType: string; resourceId: string; createdAt: Date };
type AccessRequest = {
  id: string; status: string; createdAt: Date;
  requester: { id: string; name: string; email: string };
  shareLink: { token: string; resourceType: string; resourceId: string };
};

type SettingsData = {
  user: { id: string; name: string; email: string };
  customTags: Tag[];
  shareLinks: ShareLink[];
  accessRequests: AccessRequest[];
  pendingRequests: number;
};

export function SettingsView({ data }: { data: SettingsData }) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState("tags");
  const [tags, setTags] = useState<Tag[]>(data.customTags);
  const [links, setLinks] = useState<ShareLink[]>(data.shareLinks);
  const [requests] = useState<AccessRequest[]>(data.accessRequests);
  const [pendingCount] = useState(data.pendingRequests);
  const [newTagName, setNewTagName] = useState("");
  const [tagError, setTagError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changing, setChanging] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSent, setDeleteSent] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleting(true);
    try {
      await requestAccountDeletion();
      setDeleteSent(true);
    } catch {
      setDeleteError(t("common.error") ?? "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError(t("auth.passwordsDontMatch"));
      return;
    }
    if (!validatePassword(newPassword).valid) {
      setPasswordError(t("auth.passwordRequirements"));
      return;
    }
    setChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.code === "INVALID_PASSWORD") {
          setPasswordError(t("auth.wrongPassword") ?? "Current password is incorrect");
        } else {
          setPasswordError(body?.message ?? t("common.error") ?? "Something went wrong");
        }
        return;
      }
      setPasswordMessage(t("auth.passwordChanged") ?? "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError(t("common.error") ?? "Something went wrong");
    } finally {
      setChanging(false);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setTagError("");
    try {
      const tag = await createCustomTag(name);
      setTags((prev) => [...prev, tag]);
      setNewTagName("");
    } catch (e) {
      setTagError(e instanceof Error ? e.message : "Failed to create tag");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    try {
      await deleteCustomTag(tagId);
    } catch {
      setTags((prev) => [...prev, tags.find((t) => t.id === tagId)!]);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    try {
      await deleteShareLink(linkId);
    } catch {
      setTags((prev) => [...prev]);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-bold tracking-wide">{t("nav.settings") ?? "Settings"}</h1>

      <Tabs
        tabs={[
          { id: "tags", label: t("tags.title") ?? "Custom Tags", count: tags.length },
          { id: "sharing", label: t("sharing.shareLink") ?? "Sharing", count: pendingCount || undefined },
          { id: "profile", label: t("common.profile") ?? "Profile" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "profile" && (
        <>
          <Card className="space-y-4 p-4">
            <CardTitle>{t("common.profile") ?? "Profile"}</CardTitle>
            <Input label="Name" value={data.user.name} readOnly />
            <Input label="Email" value={data.user.email} readOnly />
          </Card>

          <Card className="space-y-4 p-4">
            <CardTitle>{t("auth.changePassword") ?? "Change Password"}</CardTitle>

            <Input
              type="password"
              autoComplete="current-password"
              label={t("auth.currentPassword") ?? "Current Password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <PasswordInput
              label={t("auth.newPassword") ?? "New Password"}
              value={newPassword}
              onChange={setNewPassword}
            />
            <Input
              type="password"
              autoComplete="new-password"
              label={t("auth.confirmPassword") ?? "Confirm Password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {passwordMessage && (
              <p className="text-sm text-green-400">{passwordMessage}</p>
            )}
            {passwordError && (
              <p className="text-sm text-red-400">{passwordError}</p>
            )}

            <Button
              variant="primary"
              onClick={handleChangePassword}
              disabled={changing || !currentPassword || !newPassword || !confirmPassword}
            >
              {changing
                ? (t("common.loading") ?? "Loading...")
                : (t("auth.changePassword") ?? "Change Password")}
            </Button>
          </Card>

          <Card className="space-y-4 p-4">
            <CardTitle className="text-red-400">{t("auth.dangerZone") ?? "Danger Zone"}</CardTitle>
            <p className="text-sm text-zinc-400">
              {t("auth.deleteAccountWarning") ?? "Permanently delete your account and all associated data. This action cannot be undone."}
            </p>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              {t("auth.deleteAccount") ?? "Delete Account"}
            </Button>
          </Card>
        </>
      )}

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("auth.deleteAccount") ?? "Delete Account"}>
        {deleteSent ? (
          <div className="space-y-4">
            <p className="text-sm text-green-400">
              {t("auth.deleteEmailSent") ?? "Check your email for the confirmation link to complete the deletion."}
            </p>
            <Button variant="ghost" onClick={() => { setDeleteOpen(false); setDeleteSent(false); }}>
              {t("common.close") ?? "Close"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              {t("auth.deleteConfirmMessage") ?? "This will permanently delete:"}
            </p>
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-zinc-400">
              <li>{t("auth.deletesGroups") ?? "All your groups"}</li>
              <li>{t("auth.deletesMatches") ?? "All matches and rounds"}</li>
              <li>{t("auth.deletesNotes") ?? "All notes and tags"}</li>
              <li>{t("auth.deletesShares") ?? "All share links and access requests"}</li>
            </ul>
            <p className="text-sm text-red-400">
              {t("auth.deleteIrreversible") ?? "This action cannot be undone."}
            </p>
            {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                {t("common.cancel") ?? "Cancel"}
              </Button>
              <Button variant="danger" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting
                  ? (t("common.loading") ?? "Loading...")
                  : (t("auth.deleteAccount") ?? "Delete Account")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {activeTab === "tags" && (
        <div className="space-y-4">
          <Card className="p-4">
            <CardTitle>{t("tags.title") ?? "Custom Tags"}</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              {tags.length}/3 {t("tags.max") ?? "custom tags used"}
            </p>

            <div className="mt-4 space-y-2">
              {tags.length === 0 && (
                <p className="text-sm text-zinc-500">{t("tags.noTags") ?? "No custom tags yet"}</p>
              )}
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <span className="text-sm text-zinc-200">{tag.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              ))}
            </div>

            {tags.length < 3 && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={t("tags.newTag") ?? "New tag name"}
                  error={tagError}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateTag(); }}
                />
                <Button variant="primary" onClick={handleCreateTag}>
                  {t("common.create")}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "sharing" && (
        <div className="space-y-4">
          <Card className="p-4">
            <CardTitle>{t("sharing.shareLink") ?? "Share Links"}</CardTitle>
            <div className="mt-4 space-y-2">
              {links.length === 0 && (
                <p className="text-sm text-zinc-500">{t("sharing.noLinks") ?? "No share links"}</p>
              )}
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">
                      {link.resourceType} — {link.resourceId.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleRevokeLink(link.id)}>
                    {t("sharing.revoke")}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <CardTitle>
              {t("sharing.accessRequests") ?? "Access Requests"}
              {pendingCount > 0 && (
                <span className="ml-2 rounded bg-cs2-orange/10 px-1.5 py-0.5 text-xs text-cs2-orange">
                  {pendingCount} pending
                </span>
              )}
            </CardTitle>
            <div className="mt-4 space-y-2">
              {requests.length === 0 && (
                <p className="text-sm text-zinc-500">{t("sharing.noRequests") ?? "No access requests"}</p>
              )}
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-zinc-200">{req.requester.name}</p>
                    <p className="text-xs text-zinc-500">
                      {req.requester.email} — {req.status}
                    </p>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    req.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" :
                    req.status === "APPROVED" ? "bg-green-500/10 text-green-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
