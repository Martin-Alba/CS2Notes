import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { resolveShareLink, getSharedResource } from "@/features/sharing/actions";
import dynamic from "next/dynamic";

const SharedGroupView = dynamic(() => import("@/features/sharing/shared-group-view").then((m) => ({ default: m.SharedGroupView })));
const SharedMatchView = dynamic(() => import("@/features/sharing/shared-match-view").then((m) => ({ default: m.SharedMatchView })));
import { AccessRequestButton } from "@/features/sharing/access-request-button";

export default async function SharedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("sharing");
  const tCommon = await getTranslations("common");
  const session = await getSession();

  const shareLink = await resolveShareLink(token);
  if (!shareLink) notFound();

  const data = await getSharedResource(shareLink.id);
  if (!data) notFound();

  const { resource, access } = data;

  if (access === "none") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-bold">{t("shareLink")}</h1>
        <p className="text-zinc-500">
          {session?.user
            ? t("requestAccess")
            : `${tCommon("signIn")} ${t("requestAccess").toLowerCase()}`}
        </p>
        <AccessRequestButton shareLinkId={shareLink.id} />
      </div>
    );
  }

  if (!resource) notFound();

  if (shareLink.resourceType === "GROUP") {
    const group = resource as { id: string; name: string; description: string | null; owner: { name: string }; _count: { matches: number } };
    return <SharedGroupView group={group} isOwner={access === "owner"} />;
  }

  if (shareLink.resourceType === "MATCH") {
    const matchResource = resource as {
      id: string; title: string; mapName: string;
      group: { name: string; ownerId: string };
      rounds: { id: string; roundNumber: number; notes: { id: string; content: string; severity: number; type: "ERROR" | "HIT"; user: { id: string; name: string }; errorTags: { tag: { id: string; name: string } }[] }[] }[];
    };
    return <SharedMatchView match={matchResource} isOwner={access === "owner"} userId={session?.user?.id ?? ""} userName={session?.user?.name ?? ""} />;
  }

  notFound();
}
