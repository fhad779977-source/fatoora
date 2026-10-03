"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useEditor } from "@/lib/stores/editor-store";
import { draftKey, useDocuments } from "@/lib/stores/documents-store";
import { getRepository } from "@/lib/storage/idb-repository";
import { uid } from "@/lib/ids";
import { dictionaries } from "@/lib/i18n/dictionary";
import { useSettings } from "@/lib/stores/settings-store";

const DEBOUNCE_MS = 700;
const VERSION_INTERVAL_MS = 3 * 60 * 1000;

/**
 * Debounced persistence of the editor document to IndexedDB, with a synchronous
 * localStorage crash backup and periodic version snapshots.
 */
export function useAutosave() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVersionAt = useRef(0);
  const saving = useRef<Promise<void> | null>(null);

  const persist = useCallback(async (opts: { forceVersion?: boolean } = {}) => {
    const state = useEditor.getState();
    const snapshot = state.doc;
    if (!snapshot) return;
    if (saving.current) await saving.current;
    const run = (async () => {
      useEditor.getState().setSaveStatus("saving");
      const now = new Date().toISOString();
      const doc = { ...snapshot, updatedAt: now };
      try {
        await useDocuments.getState().save(doc);
        if (opts.forceVersion || Date.now() - lastVersionAt.current > VERSION_INTERVAL_MS) {
          lastVersionAt.current = Date.now();
          await getRepository().addVersion({ id: uid("v"), documentId: doc.id, savedAt: now, snapshot: doc });
        }
        // Only mark clean if nothing changed while we were saving.
        if (useEditor.getState().doc === snapshot) {
          useEditor.getState().setSaveStatus("saved", now);
          try {
            localStorage.removeItem(draftKey(doc.id));
          } catch {}
        } else {
          useEditor.getState().setSaveStatus("dirty");
        }
      } catch (e) {
        console.error(e);
        useEditor.getState().setSaveStatus("error");
        toast.error(dictionaries[useSettings.getState().locale].editor.saveFailed);
      }
    })();
    saving.current = run;
    await run;
    saving.current = null;
  }, []);

  useEffect(() => {
    const unsub = useEditor.subscribe((state, prev) => {
      if (!state.doc || state.doc === prev.doc || state.saveStatus !== "dirty") return;
      // Synchronous backup so a refresh/crash never loses the latest edit.
      try {
        localStorage.setItem(draftKey(state.doc.id), JSON.stringify(state.doc));
      } catch {
        /* quota exceeded (large images) — IndexedDB save below still runs */
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => persist(), DEBOUNCE_MS);
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [persist]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const { saveStatus } = useEditor.getState();
      if (saveStatus === "dirty" || saveStatus === "saving") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /** Immediate save (Ctrl/Cmd+S); always records a version. */
  const saveNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await persist({ forceVersion: true });
  }, [persist]);

  return { saveNow, flush: () => persist() };
}
