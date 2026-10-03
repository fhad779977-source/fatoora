"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "@/lib/types";

interface SettingsState {
  locale: Locale;
  theme: "light" | "dark";
  userName: string;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  toggleTheme: () => void;
  setUserName: (name: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      locale: "ar",
      theme: "light",
      userName: "",
      hydrated: false,
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set({ locale: get().locale === "ar" ? "en" : "ar" }),
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      setUserName: (userName) => set({ userName }),
    }),
    {
      name: "midad:settings",
      // Rehydrated manually in <Providers/> so the server render (Arabic) matches the first client render.
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ locale: s.locale, theme: s.theme, userName: s.userName }),
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    }
  )
);
