"use client";

import type { CSSProperties, ReactNode } from "react";
import type { DocumentTheme, Locale } from "@/lib/types";
import { WIDTH_PX } from "@/lib/document";
import { cn } from "@/lib/utils";

export function themeVars(theme: DocumentTheme): CSSProperties {
  return {
    "--doc-bg": theme.background,
    "--doc-surface": theme.surface,
    "--doc-text": theme.textColor,
    "--doc-muted": theme.mutedColor,
    "--doc-accent": theme.accentColor,
    "--doc-accent-soft": `color-mix(in srgb, ${theme.accentColor} 14%, ${theme.background})`,
    "--doc-border": `color-mix(in srgb, ${theme.textColor} 12%, transparent)`,
    "--doc-ring": `color-mix(in srgb, ${theme.accentColor} 28%, transparent)`,
  } as CSSProperties;
}

/**
 * The "paper": applies document theme, direction, typography and acts as the
 * container-query root (`@container/doc`) so blocks respond to the page width
 * (desktop, phone preview, PDF export) rather than the browser viewport.
 */
export function DocumentSurface({
  theme,
  language,
  children,
  className,
  style,
  padded = true,
  fixedWidth,
  contentMaxWidth,
}: {
  theme: DocumentTheme;
  language: Locale;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  padded?: boolean;
  fixedWidth?: number;
  contentMaxWidth?: number;
}) {
  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
      className={cn("@container/doc relative", className)}
      style={{
        ...themeVars(theme),
        background: "var(--doc-bg)",
        color: "var(--doc-text)",
        fontFamily: theme.fontFamily === "serif" ? "var(--font-serif)" : "var(--font-sans)",
        fontSize: theme.baseFontSize,
        width: fixedWidth,
        ...style,
      }}
    >
      <div className={cn("mx-auto", padded && "px-6 py-10 @md/doc:px-12 @md/doc:py-14 @3xl/doc:px-16")} style={{ maxWidth: contentMaxWidth ?? (fixedWidth ? undefined : WIDTH_PX[theme.width]) }}>
        {children}
      </div>
    </div>
  );
}
