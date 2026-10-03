"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LocaleToggle, ThemeToggle } from "./preferences";
import { cn } from "@/lib/utils";

export function AppHeader({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <header className={cn("sticky top-0 z-40 border-b hairline bg-background/80 backdrop-blur-xl print-hidden", className)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          {children}
          <LocaleToggle className="hidden sm:inline-flex" />
          <LocaleToggle compact className="sm:hidden" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
