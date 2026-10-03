"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { MidadDocument } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DocumentSurface } from "./document-surface";
import { DocumentRenderer } from "./document-renderer";

const RENDER_WIDTH = 820;

/** Scaled, static miniature of a document (real blocks, not an image). */
export const DocumentThumbnail = memo(function DocumentThumbnail({ doc, maxBlocks = 6, className, renderWidth = RENDER_WIDTH }: { doc: MidadDocument; maxBlocks?: number; className?: string; renderWidth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / renderWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [renderWidth]);

  const preview = { ...doc, blocks: doc.blocks.slice(0, maxBlocks) };

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} style={{ background: doc.theme.background }} aria-hidden>
      {scale > 0 ? (
        <div className="pointer-events-none absolute top-0 left-0 origin-top-left select-none" style={{ width: renderWidth, transform: `scale(${scale})` }} inert>
          <DocumentSurface theme={doc.theme} language={doc.language} fixedWidth={renderWidth}>
            {doc.blocks.length ? <DocumentRenderer doc={preview} mode="export" canFill={false} /> : <div className="h-[600px]" />}
          </DocumentSurface>
        </div>
      ) : null}
    </div>
  );
});
