"use client";

import { createContext, useContext } from "react";
import type { AnyBlock, BlockPropsMap, BlockType, DocumentTheme, Locale } from "@/lib/types";

export type RenderMode = "edit" | "view" | "export";

export interface RenderContextValue {
  mode: RenderMode;
  locale: Locale;
  theme: DocumentTheme;
  documentId: string;
  /** Viewer may fill forms / sign. */
  canFill: boolean;
  onInlineEdit?: <T extends BlockType>(blockId: string, patch: Partial<BlockPropsMap[T]>) => void;
  onSubmitForm?: (block: AnyBlock, values: Record<string, string>) => Promise<void> | void;
  onSign?: (block: AnyBlock, dataUrl: string) => void;
  /** Signatures collected from the current viewer (not stored in the document itself). */
  viewerSignatures?: Record<string, string>;
}

export const RenderContext = createContext<RenderContextValue | null>(null);

export function useRenderContext() {
  const ctx = useContext(RenderContext);
  if (!ctx) throw new Error("RenderContext missing");
  return ctx;
}
