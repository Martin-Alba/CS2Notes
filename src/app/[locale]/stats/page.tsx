import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";

const StatsView = dynamic(() => import("@/features/stats/stats-view").then((m) => ({ default: m.StatsView })), {
  loading: () => <div className="h-96 animate-pulse rounded-lg bg-white/[0.03]" />,
});

export default async function StatsPage() {
  const t = await getTranslations("stats");
  const session = await getSession();
  if (!session?.user)
    return <p className="text-sm text-zinc-500">{t("title")}</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold tracking-wide">{t("title")}</h1>
      <StatsView />
    </div>
  );
}
