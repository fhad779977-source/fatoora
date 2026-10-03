"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { FileQuestion, Plus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { BlockType, MidadDocument } from "@/lib/types";
import { useEditor } from "@/lib/stores/editor-store";
import { draftKey, useDocuments } from "@/lib/stores/documents-store";
import { getRepository } from "@/lib/storage/idb-repository";
import { normalizeDocument } from "@/lib/document";
import { useT } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";
import { useAutosave } from "@/hooks/use-autosave";
import { useDocumentInteractions } from "@/hooks/use-interactions";
import { DocumentSurface } from "@/components/document/document-surface";
import { DocumentRenderer } from "@/components/document/document-renderer";
import { ShareDialog } from "@/components/shared/share-dialog";
import { ExportPdfDialog } from "@/components/shared/export-pdf-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EditorTopBar } from "./top-bar";
import { BlockPalette, PaletteChip } from "./block-palette";
import { EditorCanvas, type DropIndicator } from "./editor-canvas";
import { Inspector } from "./inspector";
import { HistoryDialog } from "./history-dialog";

type ActiveDrag = { kind: "palette"; type: BlockType } | { kind: "block"; id: string } | null;

function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null;
  return !!node && (node.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName));
}

export function EditorView({ id }: { id: string }) {
  const t = useT();
  const doc = useEditor((s) => s.doc);
  const mode = useEditor((s) => s.mode);
  const device = useEditor((s) => s.device);
  const selectedId = useEditor((s) => s.selectedId);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [active, setActive] = useState<ActiveDrag>(null);
  const [indicator, setIndicator] = useState<DropIndicator>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { saveNow } = useAutosave();
  const interactions = useDocumentInteractions(doc?.id);

  // Load document (+ restore a newer unsaved local backup if the tab was closed mid-edit).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getRepository().get(id);
      let backup: MidadDocument | null = null;
      try {
        const raw = localStorage.getItem(draftKey(id));
        backup = raw ? normalizeDocument(JSON.parse(raw)) : null;
      } catch {}
      if (cancelled) return;
      if (!stored && !backup) return setState("missing");
      const useBackup = !!backup && (!stored || backup.updatedAt > stored.updatedAt);
      const doc = useBackup ? backup! : stored!;
      useEditor.getState().load(doc);
      if (useBackup) {
        await useDocuments.getState().save(doc);
        toast.success(t.editor.restored);
      }
      setState("ready");
    })();
    return () => {
      cancelled = true;
      useEditor.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (doc?.title) document.title = `${doc.title} · مِداد`;
  }, [doc?.title]);

  const manualSave = useCallback(async () => {
    await saveNow();
    if (useEditor.getState().saveStatus === "saved") toast.success(t.editor.savedToast);
  }, [saveNow, t.editor.savedToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const editor = useEditor.getState();
      if (mod && key === "s") {
        e.preventDefault();
        manualSave();
      } else if (mod && key === "z") {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur?.();
        if (e.shiftKey) editor.redo();
        else editor.undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        editor.redo();
      } else if (mod && key === "d" && editor.selectedId) {
        e.preventDefault();
        editor.duplicateBlock(editor.selectedId);
      } else if ((e.key === "Delete" || e.key === "Backspace") && editor.selectedId && !isTypingTarget(e.target) && editor.mode === "edit") {
        e.preventDefault();
        editor.removeBlock(editor.selectedId);
        toast(t.editor.blockDeleted, { action: { label: t.editor.undo, onClick: () => useEditor.getState().undo() } });
      } else if (e.key === "Escape" && !isTypingTarget(e.target)) {
        editor.select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [manualSave, t.editor.blockDeleted, t.editor.undo]);

  const addBlock = useCallback((type: BlockType) => {
    const editor = useEditor.getState();
    if (editor.mode !== "edit") editor.setMode("edit");
    const blocks = editor.doc?.blocks ?? [];
    const selectedIndex = blocks.findIndex((b) => b.id === editor.selectedId);
    const block = editor.addBlock(type, selectedIndex >= 0 ? selectedIndex + 1 : undefined);
    setPaletteOpen(false);
    if (block) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.querySelector(`[data-editor-block="${block.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }))
      );
    }
  }, []);

  // Drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const dropPosition = (e: DragOverEvent | DragEndEvent): DropIndicator => {
    const { over, active } = e;
    if (!over || over.id === "canvas-end") return null;
    const translated = active.rect.current.translated;
    const center = translated ? translated.top + translated.height / 2 : 0;
    return { id: String(over.id), position: center > over.rect.top + over.rect.height / 2 ? "after" : "before" };
  };

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as { source?: string; type?: BlockType } | undefined;
    if (data?.source === "palette" && data.type) setActive({ kind: "palette", type: data.type });
    else setActive({ kind: "block", id: String(e.active.id) });
  };

  const onDragOver = (e: DragOverEvent) => {
    if (active?.kind === "palette") setIndicator(dropPosition(e));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const editor = useEditor.getState();
    const blocks = editor.doc?.blocks ?? [];
    const { over } = e;
    if (active?.kind === "palette" && over) {
      if (over.id === "canvas-end") editor.addBlock(active.type);
      else {
        const pos = dropPosition(e);
        const index = blocks.findIndex((b) => b.id === over.id);
        if (index >= 0) editor.addBlock(active.type, pos?.position === "after" ? index + 1 : index);
      }
    } else if (active?.kind === "block" && over && over.id !== e.active.id) {
      const from = blocks.findIndex((b) => b.id === e.active.id);
      const to = over.id === "canvas-end" ? blocks.length - 1 : blocks.findIndex((b) => b.id === over.id);
      if (from >= 0 && to >= 0) editor.reorder(from, to);
    }
    setActive(null);
    setIndicator(null);
  };

  const activeBlock = useMemo(() => (active?.kind === "block" ? doc?.blocks.find((b) => b.id === active.id) : null), [active, doc?.blocks]);

  if (state === "loading") {
    return (
      <div className="flex h-dvh flex-col">
        <div className="h-14 border-b" />
        <div className="flex flex-1 items-start justify-center bg-muted/40 p-8">
          <div className="w-full max-w-3xl space-y-4 rounded-2xl bg-card p-10">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (state === "missing" || !doc) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <FileQuestion className="size-10 text-copper" />
        <h1 className="font-display text-3xl font-semibold">{t.editor.notFound}</h1>
        <p className="text-muted-foreground">{t.editor.notFoundBody}</p>
        <Button asChild>
          <Link href="/dashboard">{t.editor.backToDashboard}</Link>
        </Button>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => (setActive(null), setIndicator(null))}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <EditorTopBar onShare={() => setShareOpen(true)} onExport={() => setExportOpen(true)} onHistory={() => setHistoryOpen(true)} onSave={manualSave} />
        <div className="flex min-h-0 flex-1">
          {/* Elements sidebar */}
          <AnimatePresence initial={false}>
            {mode === "edit" ? (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 272, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="hidden shrink-0 overflow-hidden border-e bg-surface lg:block"
              >
                <div className="h-full w-[272px] overflow-y-auto p-4 scrollbar-thin">
                  <div className="mb-1 text-sm font-semibold">{t.editor.elements}</div>
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{t.editor.elementsHint}</p>
                  <BlockPalette onAdd={addBlock} />
                </div>
              </motion.aside>
            ) : null}
          </AnimatePresence>

          {/* Workspace */}
          <main
            ref={canvasRef}
            className="relative min-w-0 flex-1 overflow-y-auto bg-[color-mix(in_srgb,var(--muted)_70%,var(--background))] scrollbar-thin"
            onClick={() => useEditor.getState().select(null)}
          >
            <div className={cn("px-3 py-6 sm:px-8 sm:py-10", mode === "edit" && "pb-32 lg:pb-16")}>
              {mode === "edit" ? (
                <EditorCanvas indicator={indicator} />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("mx-auto w-full overflow-hidden shadow-[0_20px_50px_-12px_rgba(11,18,32,.18)]", device === "mobile" ? "max-w-[390px] rounded-[32px] border-[7px] border-navy" : "max-w-[1000px] rounded-2xl")}
                >
                  <DocumentSurface theme={doc.theme} language={doc.language} className="min-h-[70vh]">
                    <DocumentRenderer doc={doc} mode="view" canFill {...interactions} />
                  </DocumentSurface>
                </motion.div>
              )}
            </div>
          </main>

          {/* Properties */}
          <AnimatePresence initial={false}>
            {mode === "edit" ? (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="hidden shrink-0 overflow-hidden border-s bg-surface lg:block"
              >
                <div className="h-full w-[320px] overflow-y-auto scrollbar-thin">
                  <Inspector />
                </div>
              </motion.aside>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Mobile / tablet action bar */}
        {mode === "edit" ? (
          <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center gap-2 p-4 lg:hidden">
            <Button size="lg" className="rounded-full shadow-xl shadow-navy/25" onClick={() => setPaletteOpen(true)}>
              <Plus />
              {t.editor.addElement}
            </Button>
            <Button size="lg" variant="outline" className="rounded-full bg-card shadow-xl shadow-navy/15" onClick={() => setInspectorOpen(true)}>
              <SlidersHorizontal />
              {selectedId ? t.editor.properties : t.editor.document}
            </Button>
          </div>
        ) : null}
      </div>

      <DragOverlay dropAnimation={{ duration: 180 }}>
        {active?.kind === "palette" ? <PaletteChip type={active.type} /> : activeBlock ? <PaletteChip type={activeBlock.type} /> : null}
      </DragOverlay>

      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent side="bottom" className="lg:hidden">
          <SheetHeader>
            <SheetTitle>{t.editor.elements}</SheetTitle>
            <SheetDescription>{t.editor.elementsHint}</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-5 pb-8">
            <BlockPalette onAdd={addBlock} draggable={false} />
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent side="bottom" className="lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{t.editor.properties}</SheetTitle>
            <SheetDescription>{t.editor.properties}</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto pb-8">
            <Inspector />
          </div>
        </SheetContent>
      </Sheet>

      <ShareDialog doc={doc} open={shareOpen} onOpenChange={setShareOpen} onUpdate={(patch) => useEditor.getState().updateDoc(patch)} />
      <ExportPdfDialog doc={doc} open={exportOpen} onOpenChange={setExportOpen} />
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </DndContext>
  );
}
