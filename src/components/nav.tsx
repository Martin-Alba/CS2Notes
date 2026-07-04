"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@nanostores/react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import dynamic from "next/dynamic";

const NotificationBell = dynamic(() => import("@/features/sharing/notification-bell").then((m) => ({ default: m.NotificationBell })));

function LocaleSwitch() {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    const path = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
    window.location.href = newLocale === "en" ? path : `/${newLocale}${path}`;
  };

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      <button onClick={() => switchLocale("en")} className={`px-1.5 py-0.5 rounded transition-colors ${locale === "en" ? "text-cs2-orange" : "text-zinc-500 hover:text-zinc-300"}`}>{tCommon("en")}</button>
      <span className="text-zinc-600">|</span>
      <button onClick={() => switchLocale("es")} className={`px-1.5 py-0.5 rounded transition-colors ${locale === "es" ? "text-cs2-orange" : "text-zinc-500 hover:text-zinc-300"}`}>{tCommon("es")}</button>
    </div>
  );
}

export function Nav() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const session = useStore(authClient.useSession);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <nav className="glass-card sticky top-0 z-40 mx-auto mb-6 w-full max-w-[1200px] rounded-none border-x-0 border-t-0 sm:mt-4 sm:rounded-xl">
      <div className="mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-heading text-lg font-bold tracking-wide text-cs2-orange text-neon">
          CS2 Notes
        </Link>

        <div className="hidden items-center gap-4 text-sm md:flex">
          {session.data?.user ? (
            <>
              <Link href="/" className="text-zinc-400 transition-colors hover:text-cs2-orange">
                {t("dashboard")}
              </Link>
              <Link href="/groups" className="text-zinc-400 transition-colors hover:text-cs2-orange">
                {t("groups")}
              </Link>
              <Link href="/stats" className="text-zinc-400 transition-colors hover:text-cs2-orange">
                {t("stats")}
              </Link>
              <Link href="/settings" className="text-zinc-400 transition-colors hover:text-cs2-orange">
                {t("settings")}
              </Link>
              <NotificationBell />
              <LocaleSwitch />
              <button
                onClick={handleSignOut}
                className="glass-btn rounded-lg px-3 py-1.5 text-xs text-zinc-300"
              >
                {tCommon("signOut")}
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="text-zinc-400 transition-colors hover:text-cs2-orange">
                {tCommon("signIn")}
              </Link>
              <Link
                href="/auth/sign-up"
                className="glass-btn rounded-lg px-3 py-1.5 text-xs text-zinc-300"
              >
                {tCommon("signUp")}
              </Link>
              <LocaleSwitch />
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {session.data?.user && <NotificationBell />}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="glass-btn rounded-lg p-1.5 text-zinc-400 hover:text-cs2-orange"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 px-4 pb-3 pt-2 md:hidden">
          <div className="flex flex-col gap-2 text-sm">
            {session.data?.user ? (
              <>
                <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-cs2-orange">
                  {t("dashboard")}
                </Link>
                <Link href="/groups" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-cs2-orange">
                  {t("groups")}
                </Link>
                <Link href="/stats" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-cs2-orange">
                  {t("stats")}
                </Link>
                <Link href="/settings" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-cs2-orange">
                  {t("settings")}
                </Link>
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  className="rounded-lg px-3 py-2 text-left text-zinc-400 transition-colors hover:bg-white/5 hover:text-cs2-orange"
                >
                  {tCommon("signOut")}
                </button>
                <div className="px-3 pt-2">
                  <LocaleSwitch />
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/sign-in" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-cs2-orange">
                  {tCommon("signIn")}
                </Link>
                <Link href="/auth/sign-up" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-cs2-orange">
                  {tCommon("signUp")}
                </Link>
                <div className="px-3 pt-2">
                  <LocaleSwitch />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
