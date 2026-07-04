import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { getSettingsData } from "@/features/settings/actions";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const t = await getTranslations("common");
  const session = await getSession();
  if (!session?.user) return <p>{t("signIn")} to view settings.</p>;

  const data = await getSettingsData();

  return <SettingsView data={data} />;
}
