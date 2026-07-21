import { SiteHeader } from "@/components/site-header";

/**
 * Skeletons, not a spinner — and at the final card height, so nothing
 * shifts when the real content lands.
 */
export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div
          className="h-9 w-64 animate-pulse rounded-[var(--radius-md)]"
          style={{ background: "var(--bg-sunken)" }}
        />

        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-28 animate-pulse rounded-[var(--radius-full)]"
              style={{ background: "var(--bg-sunken)" }}
            />
          ))}
        </div>

        <ul className="mt-8 space-y-4" aria-busy="true" aria-label="Loading doctors">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
            >
              <div className="flex gap-4">
                <div
                  className="h-14 w-14 shrink-0 animate-pulse rounded-full"
                  style={{ background: "var(--bg-sunken)" }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-5 w-52 animate-pulse rounded"
                    style={{ background: "var(--bg-sunken)" }}
                  />
                  <div
                    className="h-4 w-32 animate-pulse rounded"
                    style={{ background: "var(--bg-sunken)" }}
                  />
                  <div
                    className="h-4 w-72 animate-pulse rounded"
                    style={{ background: "var(--bg-sunken)" }}
                  />
                </div>
              </div>
              <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={j}
                      className="h-8 w-20 animate-pulse rounded-[var(--radius-md)]"
                      style={{ background: "var(--bg-sunken)" }}
                    />
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
