"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useSettings } from "@/lib/stores/settings-store";

function Toaster(props: ToasterProps) {
  const theme = useSettings((s) => s.theme);
  const locale = useSettings((s) => s.locale);
  return (
    <Sonner
      theme={theme}
      dir={locale === "ar" ? "rtl" : "ltr"}
      position={locale === "ar" ? "bottom-left" : "bottom-right"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-xl !shadow-navy/10 !font-sans",
          description: "!text-muted-foreground",
          success: "[&_[data-icon]]:!text-copper",
          error: "[&_[data-icon]]:!text-destructive",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
