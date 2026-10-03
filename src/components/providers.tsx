"use client";

import { useEffect, type ReactNode } from "react";
import { Direction } from "radix-ui";
import { MotionConfig } from "framer-motion";
import { useSettings } from "@/lib/stores/settings-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const locale = useSettings((s) => s.locale);
  const theme = useSettings((s) => s.theme);

  useEffect(() => {
    useSettings.persist.rehydrate();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <Direction.Provider dir={locale === "ar" ? "rtl" : "ltr"}>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={250}>
          {children}
          <Toaster />
        </TooltipProvider>
      </MotionConfig>
    </Direction.Provider>
  );
}
