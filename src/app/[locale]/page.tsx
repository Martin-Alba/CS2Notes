import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function HomePage() {
  const session = await getSession();

  if (!session?.user) {
    return <SignedOutView />;
  }

  return <DashboardView userId={session.user.id} />;
}

async function SignedOutView() {
  const t = await getTranslations("common");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">{t("appName")}</h1>
      <p className="text-zinc-400">
        Track your CS2 mistakes, improve your game.
      </p>
      <div className="flex gap-3">
        <Link
          href="/auth/sign-in"
          className="glass-btn rounded-lg px-6 py-2 text-sm text-white hover:text-cs2-orange glow-orange"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/auth/sign-up"
          className="glass-btn rounded-lg px-6 py-2 text-sm text-zinc-300"
        >
          {t("signUp")}
        </Link>
      </div>
    </div>
  );
}

async function DashboardView({ userId }: { userId: string }) {
  const t = await getTranslations();
  const groups = await db.group.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      _count: { select: { matches: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold tracking-wide">{t("nav.dashboard")}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="glass-card rounded-lg p-4">
          <p className="text-2xl font-bold">{groups.length}</p>
          <p className="text-sm text-zinc-400">{t("nav.groups")}</p>
        </div>
      </div>

      {groups.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("matches.title")}</h2>
          <div className="space-y-2">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="glass glass-hover flex items-center justify-between rounded-lg p-3 transition-all"
              >
                <span className="font-medium">{group.name}</span>
                <span className="text-sm text-zinc-500">
                  {group._count.matches} {t("matches.title")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
