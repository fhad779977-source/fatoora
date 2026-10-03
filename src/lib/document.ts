import type { AnyBlock, DocumentTheme, Locale, MidadDocument, ThemePreset } from "@/lib/types";
import { uid, uniqueSlug } from "@/lib/ids";

export const THEME_PRESETS: Record<ThemePreset, Omit<DocumentTheme, "fontFamily" | "headingFont" | "baseFontSize" | "width">> = {
  ivory: {
    preset: "ivory",
    background: "#F5F1E8",
    surface: "#FFFFFF",
    textColor: "#0B1220",
    mutedColor: "#6B7484",
    accentColor: "#B9824A",
  },
  white: {
    preset: "white",
    background: "#FFFFFF",
    surface: "#F7F4EE",
    textColor: "#0B1220",
    mutedColor: "#6B7484",
    accentColor: "#B9824A",
  },
  navy: {
    preset: "navy",
    background: "#0B1220",
    surface: "#131D30",
    textColor: "#F5F1E8",
    mutedColor: "#8993A4",
    accentColor: "#C99760",
  },
};

export function createTheme(preset: ThemePreset = "ivory", overrides: Partial<DocumentTheme> = {}): DocumentTheme {
  return {
    ...THEME_PRESETS[preset],
    fontFamily: "sans",
    headingFont: "serif",
    baseFontSize: 17,
    width: "normal",
    ...overrides,
  };
}

export function createDocument(input: {
  title: string;
  language?: Locale;
  blocks?: AnyBlock[];
  theme?: DocumentTheme;
  templateId?: string;
}): MidadDocument {
  const now = new Date().toISOString();
  return {
    id: uid("doc"),
    title: input.title,
    slug: uniqueSlug(input.title),
    language: input.language ?? "ar",
    theme: input.theme ?? createTheme("ivory"),
    blocks: input.blocks ?? [],
    createdAt: now,
    updatedAt: now,
    status: "draft",
    permissions: { access: "fill", allowDownload: true, allowPrint: true },
    templateId: input.templateId,
  };
}

export const WIDTH_PX: Record<DocumentTheme["width"], number> = { narrow: 680, normal: 820, wide: 1000 };

/** Validates & normalises something that claims to be a MidadDocument (import, share links). */
export function normalizeDocument(raw: unknown): MidadDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<MidadDocument>;
  if (typeof d.title !== "string" || !Array.isArray(d.blocks)) return null;
  const base = createDocument({ title: d.title, language: d.language === "en" ? "en" : "ar" });
  return {
    ...base,
    ...d,
    id: typeof d.id === "string" ? d.id : base.id,
    slug: typeof d.slug === "string" ? d.slug : base.slug,
    theme: { ...createTheme(d.theme?.preset ?? "ivory"), ...(d.theme ?? {}) },
    permissions: { ...base.permissions, ...(d.permissions ?? {}) },
    blocks: d.blocks.filter((b): b is AnyBlock => !!b && typeof b === "object" && "type" in b && "props" in b),
  } as MidadDocument;
}
