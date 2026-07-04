import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";
import { db } from "./db";
import { sendEmail, renderEmailTemplate } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password — CS2 Error Notes",
        html: renderEmailTemplate({
          title: "Reset your password",
          body: `<p>We received a request to reset your password. Use the link below to choose a new one. This link expires in 1 hour.</p>
<p><a href="${url}">${url}</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
        }),
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email — CS2 Error Notes",
        html: renderEmailTemplate({
          title: "Verify your email",
          body: `<p>Thanks for signing up! Use the link below to confirm your email address and activate your account.</p>
<p><a href="${url}">${url}</a></p>
<p>This link expires in 1 hour. If you didn't create an account, you can safely ignore this email.</p>`,
        }),
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
