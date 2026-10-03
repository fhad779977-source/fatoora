"use client";

import { useMemo, useState } from "react";
import type { MidadDocument } from "@/lib/types";
import { RenderContext, type RenderContextValue } from "@/components/blocks/context";
import { BlockShell } from "@/components/blocks/shell";
import { BlockContent } from "@/components/blocks/block-view";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/** Read-only renderer used by the viewer, share route, landing mockups and PDF export. */
export function DocumentRenderer({
  doc,
  mode = "view",
  canFill = true,
  onSubmitForm,
  onSign,
  viewerSignatures,
}: {
  doc: MidadDocument;
  mode?: "view" | "export";
  canFill?: boolean;
  onSubmitForm?: RenderContextValue["onSubmitForm"];
  onSign?: RenderContextValue["onSign"];
  viewerSignatures?: Record<string, string>;
}) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const ctx = useMemo<RenderContextValue>(
    () => ({ mode, locale: doc.language, theme: doc.theme, documentId: doc.id, canFill, onSubmitForm, onSign, viewerSignatures }),
    [mode, doc.language, doc.theme, doc.id, canFill, onSubmitForm, onSign, viewerSignatures]
  );

  return (
    <RenderContext.Provider value={ctx}>
      {doc.blocks.map((block) => (
        <BlockShell key={block.id} block={block}>
          <BlockContent block={block} onOpenImage={(src, alt) => setLightbox({ src, alt })} />
        </BlockShell>
      ))}
      {mode === "view" ? (
        <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
          <DialogContent className="max-w-[min(1100px,calc(100%-2rem))] border-0 bg-transparent p-0 shadow-none">
            <DialogTitle className="sr-only">{lightbox?.alt}</DialogTitle>
            {lightbox ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightbox.src} alt={lightbox.alt} className="max-h-[85dvh] w-full rounded-2xl object-contain" />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </RenderContext.Provider>
  );
}
