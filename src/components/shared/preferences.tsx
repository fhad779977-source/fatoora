"use client";

import { Languages, Moon, Sun } from "lucide-react";
import { useSettings } from "@/lib/stores/settings-store";
import { useT } from "@/lib/i18n/use-t";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function LocaleToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const toggle = useSettings((s) => s.toggleLocale);
  const t = useT();
  return (
    <Hint label={t.common.language}>
      <Button variant="ghost" size={compact ? "icon-sm" : "sm"} onClick={toggle} className={cn("gap-1.5", className)} aria-label={t.common.language}>
        <Languages />
        {compact ? null : <span className="text-[13px]">{t.common.language}</span>}
      </Button>
    </Hint>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSettings((s) => s.theme);
  const toggle = useSettings((s) => s.toggleTheme);
  const t = useT();
  const label = theme === "dark" ? t.common.lightMode : t.common.darkMode;
  return (
    <Hint label={label}>
      <Button variant="ghost" size="icon-sm" onClick={toggle} className={className} aria-label={label}>
        {theme === "dark" ? <Sun /> : <Moon />}
      </Button>
    </Hint>
  );
}
