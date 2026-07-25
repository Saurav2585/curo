"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell, CalendarPlus, CalendarX2, CalendarCheck, CalendarClock, Star, Flag,
  FileText, Check, X, Clock, CreditCard, Receipt, Tag, User, Eye, Plane, Archive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EventIcon, EventTone } from "@/lib/events";
import { eventMeta } from "@/lib/events";
import type { AppNotification } from "@/lib/notifications";
import { markNotificationRead, markAllNotificationsRead, archiveNotification } from "@/app/notifications/actions";

const ICONS: Record<EventIcon, LucideIcon> = {
  "calendar-plus": CalendarPlus, "calendar-x": CalendarX2, "calendar-check": CalendarCheck,
  "calendar-clock": CalendarClock, star: Star, flag: Flag, "file-text": FileText,
  check: Check, x: X, clock: Clock, "credit-card": CreditCard, receipt: Receipt,
  tag: Tag, user: User, eye: Eye, plane: Plane,
};

const TONES: Record<EventTone, { bg: string; fg: string }> = {
  brand: { bg: "var(--bg-brandSubtle)", fg: "var(--text-brand)" },
  success: { bg: "var(--bg-successSubtle)", fg: "var(--text-success)" },
  danger: { bg: "var(--bg-dangerSubtle)", fg: "var(--text-danger)" },
  warning: { bg: "color-mix(in srgb, var(--color-amber-500) 14%, transparent)", fg: "var(--color-amber-500)" },
  muted: { bg: "var(--bg-sunken)", fg: "var(--text-muted)" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

function NotificationRow({ n }: { n: AppNotification }) {
  const meta = eventMeta(n.event_type);
  const Icon = ICONS[meta.icon] ?? Bell;
  const tone = TONES[meta.tone];
  const unread = n.status === "unread";

  const body = (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: tone.bg }}>
        <Icon size={16} color={tone.fg} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{n.title}</p>
        {n.message && <p className="mt-0.5 text-[0.8125rem] leading-snug text-[var(--text-muted)]">{n.message}</p>}
        <p className="mt-1 text-[0.6875rem] text-[var(--text-disabled)]">{timeAgo(n.created_at)}</p>
      </div>
      {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--text-brand)" }} aria-label="Unread" />}
    </div>
  );

  return (
    <li className="group relative border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0 hover:bg-[var(--bg-sunken)]">
      {n.action_url ? (
        <Link href={n.action_url} className="block">{body}</Link>
      ) : body}

      <div className="mt-2 flex items-center gap-3 pl-11">
        {unread && (
          <form action={markNotificationRead}>
            <input type="hidden" name="id" value={n.id} />
            <button type="submit" className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-[var(--text-brand)] hover:underline">
              <Check size={12} aria-hidden /> Mark read
            </button>
          </form>
        )}
        <form action={archiveNotification}>
          <input type="hidden" name="id" value={n.id} />
          <button type="submit" className="inline-flex items-center gap-1 text-[0.6875rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            <Archive size={12} aria-hidden /> Archive
          </button>
        </form>
      </div>
    </li>
  );
}

/**
 * Reusable notification bell + dropdown. Purely presentational over data the
 * server wrapper supplies; state changes go through server actions. Shows an
 * unread count and a clean empty state.
 */
export function NotificationMenu({ items, unread }: { items: AppNotification[]; unread: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
      >
        <Bell size={18} aria-hidden />
        {unread > 0 && (
          <span
            className="tabular absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.625rem] font-semibold"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
              <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">Notifications</span>
              {unread > 0 && (
                <form action={markAllNotificationsRead}>
                  <button type="submit" className="text-[0.75rem] font-medium text-[var(--text-brand)] hover:underline">
                    Mark all read
                  </button>
                </form>
              )}
            </div>

            {items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--bg-sunken)" }}>
                  <Bell size={20} color="var(--text-muted)" aria-hidden />
                </span>
                <p className="mt-3 text-[0.875rem] font-medium text-[var(--text-primary)]">You&apos;re all caught up</p>
                <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">New notifications will appear here.</p>
              </div>
            ) : (
              <ul className="max-h-[26rem] overflow-y-auto">
                {items.map((n) => <NotificationRow key={n.id} n={n} />)}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
