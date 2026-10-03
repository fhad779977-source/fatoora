"use client";

import { create } from "zustand";
import type { MidadDocument } from "@/lib/types";
import { getRepository } from "@/lib/storage/idb-repository";
import { createDocument, normalizeDocument } from "@/lib/document";
import { cloneBlock } from "@/lib/blocks/registry";
import { uid, uniqueSlug } from "@/lib/ids";

interface DocumentsState {
  documents: MidadDocument[];
  status: "idle" | "loading" | "ready" | "error";
  load: () => Promise<void>;
  /** Persist a document (insert or update) and refresh the in-memory list. */
  save: (doc: MidadDocument) => Promise<void>;
  create: (doc?: MidadDocument) => Promise<MidadDocument>;
  duplicate: (id: string, suffix: string) => Promise<MidadDocument | undefined>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  importDocument: (raw: unknown) => Promise<MidadDocument>;
}

const sortByUpdated = (a: MidadDocument, b: MidadDocument) => b.updatedAt.localeCompare(a.updatedAt);

export const useDocuments = create<DocumentsState>()((set, get) => ({
  documents: [],
  status: "idle",

  load: async () => {
    if (get().status === "loading") return;
    set({ status: get().status === "ready" ? "ready" : "loading" });
    try {
      const docs = await getRepository().list();
      set({ documents: docs.sort(sortByUpdated), status: "ready" });
    } catch (e) {
      console.error(e);
      set({ status: "error" });
    }
  },

  save: async (doc) => {
    await getRepository().save(doc);
    const others = get().documents.filter((d) => d.id !== doc.id);
    set({ documents: [doc, ...others].sort(sortByUpdated) });
  },

  create: async (doc) => {
    const next = doc ?? createDocument({ title: "" });
    await get().save(next);
    return next;
  },

  duplicate: async (id, suffix) => {
    const source = get().documents.find((d) => d.id === id) ?? (await getRepository().get(id));
    if (!source) return undefined;
    const now = new Date().toISOString();
    const title = `${source.title} ${suffix}`.trim();
    const copy: MidadDocument = {
      ...structuredClone(source),
      id: uid("doc"),
      title,
      slug: uniqueSlug(title),
      blocks: source.blocks.map(cloneBlock),
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    await get().save(copy);
    return copy;
  },

  rename: async (id, title) => {
    const doc = get().documents.find((d) => d.id === id) ?? (await getRepository().get(id));
    if (!doc) return;
    await get().save({ ...doc, title, updatedAt: new Date().toISOString() });
  },

  remove: async (id) => {
    await getRepository().remove(id);
    try {
      localStorage.removeItem(draftKey(id));
    } catch {}
    set({ documents: get().documents.filter((d) => d.id !== id) });
  },

  importDocument: async (raw) => {
    const doc = normalizeDocument(raw);
    if (!doc) throw new Error("invalid document");
    const now = new Date().toISOString();
    const fresh: MidadDocument = {
      ...doc,
      id: uid("doc"),
      slug: uniqueSlug(doc.title),
      blocks: doc.blocks.map(cloneBlock),
      createdAt: now,
      updatedAt: now,
    };
    await get().save(fresh);
    return fresh;
  },
}));

/** Synchronous crash-safety backup key (localStorage) for a document being edited. */
export const draftKey = (id: string) => `midad:draft:${id}`;
