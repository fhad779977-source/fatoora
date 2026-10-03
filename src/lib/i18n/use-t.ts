"use client";

import { dictionaries } from "./dictionary";
import { useSettings } from "@/lib/stores/settings-store";

export function useT() {
  const locale = useSettings((s) => s.locale);
  return dictionaries[locale];
}

export function useLocale() {
  const locale = useSettings((s) => s.locale);
  return { locale, dir: locale === "ar" ? ("rtl" as const) : ("ltr" as const) };
}
