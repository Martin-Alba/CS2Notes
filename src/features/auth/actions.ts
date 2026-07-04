"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail, renderEmailTemplate } from "@/lib/email";
import { generateId } from "better-auth";

export async function requestAccountDeletion() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const token = generateId(48);
  const expiresAt = new Date(Date.now() + 3600 * 1000);

  await db.verification.create({
    data: {
      id: generateId(24),
      identifier: `delete-account:${token}`,
      value: session.user.id,
      expiresAt,
    },
  });

  const url = `${process.env.BETTER_AUTH_URL}/delete-account?token=${token}`;

  await sendEmail({
    to: session.user.email,
    subject: "Delete your account — CS2 Error Notes",
    html: renderEmailTemplate({
      title: "Delete your account",
      body: `<p>We received a request to delete your account. Use the link below to confirm. This link expires in 1 hour.</p>
<p><a href="${url}">${url}</a></p>
<p>All your groups, matches, rounds, notes, tags, and sharing data will be permanently removed.</p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
    }),
  });
}

export async function confirmAccountDeletion(token: string) {
  const verification = await db.verification.findFirst({
    where: { identifier: `delete-account:${token}` },
  });

  if (!verification || verification.expiresAt < new Date()) {
    return { error: "Invalid or expired token" as const };
  }

  const userId = verification.value;

  await db.$transaction([
    db.verification.deleteMany({ where: { identifier: `delete-account:${token}` } }),
    db.notification.deleteMany({ where: { userId } }),
    db.accessRequest.deleteMany({ where: { requesterId: userId } }),
    db.shareLink.deleteMany({ where: { createdById: userId } }),
    db.tag.deleteMany({ where: { userId } }),
    db.note.deleteMany({ where: { userId } }),
    db.group.deleteMany({ where: { ownerId: userId } }),
    db.account.deleteMany({ where: { userId } }),
    db.session.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);

  return { success: true as const };
}
