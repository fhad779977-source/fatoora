import { cn } from "@/lib/utils";

/** Inkwell-drop mark: a calligraphic nib drop in copper on navy. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="11" fill="#0B1220" />
      <path d="M20 8.5c4.6 6 8.2 10.6 8.2 15.1A8.2 8.2 0 0 1 20 31.8a8.2 8.2 0 0 1-8.2-8.2C11.8 19.1 15.4 14.5 20 8.5Z" fill="#B9824A" />
      <path d="M20 15.5v11.2M16.6 23.3c1 2 2.1 3 3.4 3s2.4-1 3.4-3" stroke="#0B1220" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ className, showLatin = true, invert = false }: { className?: string; showLatin?: boolean; invert?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-[26px] font-bold", invert ? "text-ivory" : "text-foreground")}>مِداد</span>
        {showLatin ? <span className="mt-0.5 text-[9px] font-semibold tracking-[0.32em] text-copper">MIDAD</span> : null}
      </span>
    </span>
  );
}
