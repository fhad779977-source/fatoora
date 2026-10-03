"use client";

import { create } from "zustand";
import type { AnyBlock, BlockPropsMap, BlockStyle, BlockType, MidadDocument } from "@/lib/types";
import { cloneBlock, createBlock } from "@/lib/blocks/registry";

const HISTORY_LIMIT = 100;
const COALESCE_MS = 900;

export type SaveStatus = "saved" | "dirty" | "saving" | "error";

interface EditorState {
  doc: MidadDocument | null;
  selectedId: string | null;
  past: MidadDocument[];
  future: MidadDocument[];
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  mode: "edit" | "preview";
  device: "desktop" | "mobile";
  /** internal: coalescing of rapid edits into a single undo step */
  lastCommit: { key: string; at: number } | null;

  load: (doc: MidadDocument) => void;
  reset: () => void;
  select: (id: string | null) => void;
  setMode: (mode: "edit" | "preview") => void;
  setDevice: (device: "desktop" | "mobile") => void;
  setSaveStatus: (status: SaveStatus, savedAt?: string) => void;

  updateDoc: (patch: Partial<MidadDocument>, coalesceKey?: string) => void;
  replaceDoc: (doc: MidadDocument) => void;
  addBlock: (type: BlockType, index?: number) => AnyBlock | null;
  updateProps: <T extends BlockType>(id: string, patch: Partial<BlockPropsMap[T]>, coalesceKey?: string) => void;
  updateStyle: (id: string, patch: Partial<BlockStyle>, coalesceKey?: string) => void;
  updateBlock: (id: string, patch: Partial<Pick<AnyBlock, "hideOnMobile" | "href" | "animation">>, coalesceKey?: string) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, direction: -1 | 1) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  undo: () => void;
  redo: () => void;
}

export const useEditor = create<EditorState>()((set, get) => {
  /** Apply a change to the document, recording undo history. */
  const commit = (next: MidadDocument, coalesceKey?: string) => {
    const { doc, past, lastCommit } = get();
    if (!doc) return;
    const now = Date.now();
    const coalesce = !!coalesceKey && lastCommit?.key === coalesceKey && now - lastCommit.at < COALESCE_MS;
    set({
      doc: { ...next, updatedAt: new Date().toISOString() },
      past: coalesce ? past : [...past, doc].slice(-HISTORY_LIMIT),
      future: [],
      saveStatus: "dirty",
      lastCommit: coalesceKey ? { key: coalesceKey, at: now } : null,
    });
  };

  const mapBlocks = (fn: (b: AnyBlock) => AnyBlock): MidadDocument | null => {
    const { doc } = get();
    if (!doc) return null;
    return { ...doc, blocks: doc.blocks.map(fn) };
  };

  return {
    doc: null,
    selectedId: null,
    past: [],
    future: [],
    saveStatus: "saved",
    lastSavedAt: null,
    mode: "edit",
    device: "desktop",
    lastCommit: null,

    load: (doc) =>
      set({ doc, selectedId: null, past: [], future: [], saveStatus: "saved", lastSavedAt: doc.updatedAt, mode: "edit", lastCommit: null }),
    reset: () => set({ doc: null, selectedId: null, past: [], future: [], lastCommit: null }),
    select: (selectedId) => set({ selectedId }),
    setMode: (mode) => set({ mode, selectedId: mode === "preview" ? null : get().selectedId }),
    setDevice: (device) => set({ device }),
    setSaveStatus: (saveStatus, savedAt) => set({ saveStatus, ...(savedAt ? { lastSavedAt: savedAt } : {}) }),

    updateDoc: (patch, coalesceKey) => {
      const { doc } = get();
      if (doc) commit({ ...doc, ...patch }, coalesceKey);
    },

    replaceDoc: (next) => {
      const { doc } = get();
      if (doc) commit({ ...next, id: doc.id, slug: doc.slug, createdAt: doc.createdAt });
    },

    addBlock: (type, index) => {
      const { doc } = get();
      if (!doc) return null;
      const block = createBlock(type, doc.language) as AnyBlock;
      const blocks = [...doc.blocks];
      const at = index === undefined ? blocks.length : Math.max(0, Math.min(index, blocks.length));
      blocks.splice(at, 0, block);
      commit({ ...doc, blocks });
      set({ selectedId: block.id });
      return block;
    },

    updateProps: (id, patch, coalesceKey) => {
      const next = mapBlocks((b) => (b.id === id ? ({ ...b, props: { ...b.props, ...patch } } as AnyBlock) : b));
      if (next) commit(next, coalesceKey ?? `props:${id}:${Object.keys(patch).join(",")}`);
    },

    updateStyle: (id, patch, coalesceKey) => {
      const next = mapBlocks((b) => (b.id === id ? { ...b, style: { ...b.style, ...patch } } : b));
      if (next) commit(next, coalesceKey ?? `style:${id}:${Object.keys(patch).join(",")}`);
    },

    updateBlock: (id, patch, coalesceKey) => {
      const next = mapBlocks((b) => (b.id === id ? ({ ...b, ...patch } as AnyBlock) : b));
      if (next) commit(next, coalesceKey ?? `block:${id}:${Object.keys(patch).join(",")}`);
    },

    removeBlock: (id) => {
      const { doc, selectedId } = get();
      if (!doc) return;
      commit({ ...doc, blocks: doc.blocks.filter((b) => b.id !== id) });
      if (selectedId === id) set({ selectedId: null });
    },

    duplicateBlock: (id) => {
      const { doc } = get();
      if (!doc) return;
      const index = doc.blocks.findIndex((b) => b.id === id);
      if (index < 0) return;
      const copy = cloneBlock(doc.blocks[index]);
      const blocks = [...doc.blocks];
      blocks.splice(index + 1, 0, copy);
      commit({ ...doc, blocks });
      set({ selectedId: copy.id });
    },

    moveBlock: (id, direction) => {
      const { doc } = get();
      if (!doc) return;
      const from = doc.blocks.findIndex((b) => b.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= doc.blocks.length) return;
      get().reorder(from, to);
    },

    reorder: (fromIndex, toIndex) => {
      const { doc } = get();
      if (!doc || fromIndex === toIndex) return;
      const blocks = [...doc.blocks];
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      commit({ ...doc, blocks });
    },

    undo: () => {
      const { doc, past, future } = get();
      if (!doc || past.length === 0) return;
      const prev = past[past.length - 1];
      set({ doc: prev, past: past.slice(0, -1), future: [doc, ...future], saveStatus: "dirty", lastCommit: null });
      const sel = get().selectedId;
      if (sel && !prev.blocks.some((b) => b.id === sel)) set({ selectedId: null });
    },

    redo: () => {
      const { doc, past, future } = get();
      if (!doc || future.length === 0) return;
      const [next, ...rest] = future;
      set({ doc: next, past: [...past, doc], future: rest, saveStatus: "dirty", lastCommit: null });
    },
  };
});
