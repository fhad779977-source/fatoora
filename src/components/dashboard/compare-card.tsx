"use client";

import { Check, X } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";

export function ComparePoints({ variant = "card", className }: { variant?: "card" | "large"; className?: string }) {
  const t = useT();
  const large = variant === "large";
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", large && "gap-4 md:gap-6", className)}>
      <div className={cn("rounded-2xl border bg-card/60 p-5", large && "p-6 md:p-8")}>
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 items-center rounded-md bg-muted px-2 text-[11px] font-bold tracking-wider text-muted-foreground">PDF</span>
          <span className={cn("font-semibold text-muted-foreground", large && "text-lg")}>{t.landing.pdfLabel}</span>
        </div>
        <ul className={cn("space-y-2.5", large && "space-y-3.5")}>
          {t.landing.pdfPoints.map((p) => (
            <li key={p} className={cn("flex items-start gap-2.5 text-sm text-muted-foreground", large && "text-base")}>
              <X className="mt-0.5 size-4 shrink-0 opacity-60" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className={cn("relative overflow-hidden rounded-2xl bg-navy p-5 text-ivory", large && "p-6 md:p-8")}>
                <div className="relative mb-4 flex items-center gap-2.5">
          <span className="flex h-8 items-center rounded-md bg-copper px-2 font-display text-base font-bold">مِداد</span>
          <span className={cn("font-semibold", large && "text-lg")}>{t.landing.midadLabel}</span>
        </div>
        <ul className={cn("relative space-y-2.5", large && "space-y-3.5")}>
          {t.landing.midadPoints.map((p) => (
            <li key={p} className={cn("flex items-start gap-2.5 text-sm", large && "text-base")}>
              <Check className="mt-0.5 size-4 shrink-0 text-copper" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
