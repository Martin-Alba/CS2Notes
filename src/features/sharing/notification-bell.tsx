"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { authClient } from "@/lib/auth-client";
import { getNotifications, markNotificationRead, approveAccess, rejectAccess } from "./actions";

type AppNotification = {
  id: string;
  type: "ACCESS_REQUEST" | "ACCESS_APPROVED";
  metadata: Record<string, string>;
  read: boolean;
  createdAt: Date;
};

export function NotificationBell() {
  const session = useStore(authClient.useSession);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data as unknown as AppNotification[]);
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!session.data?.user) return;

    const fetch = () =>
      getNotifications().then((data) => {
        if (!mounted) return;
        setNotifications((prev) => {
          const prevIds = new Set(prev.map((n) => n.id));
          const merged = [...prev];
          for (const n of data as unknown as AppNotification[]) {
            if (!prevIds.has(n.id)) merged.push(n);
          }
          return merged.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      });

    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [session.data?.user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleApprove = async (notificationId: string, accessRequestId: string) => {
    await approveAccess(accessRequestId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleReject = async (notificationId: string, accessRequestId: string) => {
    await rejectAccess(accessRequestId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  if (!session.data?.user) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="relative">
        <button
          onClick={() => { fetchNotifications(); setOpen(!open); }}
          className="glass-btn relative rounded-lg p-1.5 text-zinc-400 hover:text-cs2-orange"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-cs2-red text-[10px] font-medium text-white glow-red">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-[90vw] max-w-sm rounded-lg glass-card p-1 sm:w-80">
          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length === 0 && (
              <p className="p-3 text-sm text-zinc-500">No notifications</p>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-md p-3 text-sm ${n.read ? "" : "bg-white/5"}`}
              >
                <p className="text-zinc-200">
                  {n.type === "ACCESS_REQUEST"
                    ? `${n.metadata.requesterName ?? "Someone"} requested access`
                    : "Access approved"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
                {!n.read && n.type === "ACCESS_REQUEST" && n.metadata.accessRequestId ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleApprove(n.id, n.metadata.accessRequestId!)}
                      className="glass-btn rounded border border-cs2-green/30 bg-cs2-green/10 px-2 py-0.5 text-xs text-cs2-green hover:bg-cs2-green/20 glow-green"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(n.id, n.metadata.accessRequestId!)}
                      className="glass-btn rounded border border-cs2-red/30 bg-cs2-red/10 px-2 py-0.5 text-xs text-cs2-red hover:bg-cs2-red/20 glow-red"
                    >
                      Reject
                    </button>
                  </div>
                ) : !n.read ? (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="mt-1 text-xs text-zinc-500 transition-colors hover:text-cs2-orange"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
