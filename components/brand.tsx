/**
 * Brand marks. Plain <img> (not next/image) so the logo is served straight from
 * /public with no image-optimizer step — bulletproof across dev and prod.
 */

/** Full horizontal logo lockup (mark + wordmark). Use in headers and auth pages. */
export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="Curo — better care, one click away" className={className} />
  );
}

/** Icon mark only. Use in sidebars and tight spaces. */
export function LogoMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/mark.png" alt="Curo" className={className} />
  );
}
