import Image from "next/image";

/** Full horizontal logo lockup (mark + wordmark). Use in headers and auth pages. */
export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Curo — better care, one click away"
      width={329}
      height={85}
      className={className}
      priority
    />
  );
}

/** Icon mark only. Use in sidebars and tight spaces. */
export function LogoMark({ className = "h-8 w-auto" }: { className?: string }) {
  return <Image src="/icon.png" alt="Curo" width={79} height={85} className={className} />;
}
