import type { ComponentType } from "react";

/** Shared "reserved for a future phase" admin page. */
export function AdminPlaceholder({
  title,
  body,
  icon: Icon,
}: {
  title: string;
  body: string;
  icon: ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
      <div className="mt-6 max-w-xl rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bg-sunken)" }}>
          <Icon size={22} color="var(--text-muted)" />
        </span>
        <p className="mt-3 font-medium text-[var(--text-primary)]">Coming in a later phase</p>
        <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">{body}</p>
      </div>
    </main>
  );
}
