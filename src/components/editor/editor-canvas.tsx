"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Copy, EyeOff, GripVertical, Link2, MousePointerClick, Trash2 } from "lucide-react";
import type { AnyBlock } from "@/lib/types";
import { useEditor } from "@/lib/stores/editor-store";
import { useT } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";
import { BLOCK_ICONS } from "@/lib/blocks/registry";
import { RenderContext, type RenderContextValue } from "@/components/blocks/context";
import { BlockShell } from "@/components/blocks/shell";
import { BlockContent } from "@/components/blocks/block-view";
import { DocumentSurface } from "@/components/document/document-surface";
import { Hint } from "@/components/ui/tooltip";

export type DropIndicator = { id: string; position: "before" | "after" } | null;

function ToolbarButton({ label, onClick, children, danger, disabled }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <Hint label={label}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn("flex size-7 items-center justify-center rounded-md text-ivory/80 transition-colors hover:bg-white/10 hover:text-ivory disabled:opacity-30", danger && "hover:bg-[#B4372F] hover:text-white")}
        aria-label={label}
      >
        {children}
      </button>
    </Hint>
  );
}

function SortableBlock({ block, index, count, selected, indicator }: { block: AnyBlock; index: number; count: number; selected: boolean; indicator: DropIndicator }) {
  const t = useT();
  const { select, moveBlock, duplicateBlock, removeBlock } = useEditor.getState();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, data: { source: "canvas" } });
  const Icon = BLOCK_ICONS[block.type];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group/block relative", isDragging && "z-20 opacity-40")}
      onClick={(e) => {
        e.stopPropagation();
        select(block.id);
      }}
      data-editor-block={block.id}
    >
      {indicator?.id === block.id ? (
        <div className={cn("pointer-events-none absolute inset-x-0 z-30 h-0.5 rounded-full bg-copper", indicator.position === "before" ? "-top-1" : "-bottom-1")}>
          <span className="absolute -top-[3px] -start-1 size-2 rounded-full bg-copper" />
        </div>
      ) : null}
      <div
        className={cn(
          "pointer-events-none absolute -inset-x-3 -inset-y-1 z-10 rounded-xl border-2 transition-colors @md/doc:-inset-x-4",
          selected ? "border-copper" : "border-transparent group-hover/block:border-copper/35"
        )}
      />
      {/* Floating toolbar */}
      <div
        className={cn(
          "absolute -top-4 end-0 z-20 flex items-center gap-0.5 rounded-lg bg-navy p-0.5 shadow-lg shadow-navy/30 transition-opacity",
          selected ? "opacity-100" : "pointer-events-none opacity-0 group-hover/block:pointer-events-auto group-hover/block:opacity-100"
        )}
        dir="ltr"
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-7 cursor-grab touch-none items-center gap-1 rounded-md px-1.5 text-ivory/80 hover:bg-white/10 active:cursor-grabbing"
          aria-label="drag"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-3.5" />
          <Icon className="size-3.5 text-copper" />
        </button>
        <ToolbarButton label={t.editor.moveUp} onClick={() => moveBlock(block.id, -1)} disabled={index === 0}>
          <ArrowUp className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label={t.editor.moveDown} onClick={() => moveBlock(block.id, 1)} disabled={index === count - 1}>
          <ArrowDown className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label={t.editor.duplicateBlock} onClick={() => duplicateBlock(block.id)}>
          <Copy className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label={t.editor.deleteBlock} onClick={() => removeBlock(block.id)} danger>
          <Trash2 className="size-3.5" />
        </ToolbarButton>
      </div>
      {(block.hideOnMobile || block.href) && (
        <div className="absolute -top-3 start-0 z-20 flex gap-1">
          {block.hideOnMobile ? (
            <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground shadow-sm">
              <EyeOff className="size-3" />
              {t.editor.hiddenOnMobile}
            </span>
          ) : null}
          {block.href ? (
            <span className="flex items-center gap-1 rounded-md bg-copper-soft px-1.5 py-0.5 text-[10px] text-copper shadow-sm">
              <Link2 className="size-3" />
              {t.editor.hasLink}
            </span>
          ) : null}
        </div>
      )}
      <BlockShell block={block}>
        <BlockContent block={block} />
      </BlockShell>
    </div>
  );
}

function EndDropZone({ empty }: { empty: boolean }) {
  const t = useT();
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-end" });
  if (empty) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[340px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors",
          isOver ? "border-[var(--doc-accent)] bg-[var(--doc-accent-soft)]" : "border-[var(--doc-border)]"
        )}
      >
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}>
          <MousePointerClick className="size-9" style={{ color: "var(--doc-accent)" }} />
        </motion.div>
        <div className="mt-4 text-xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
          {isOver ? t.editor.dropHere : t.editor.emptyCanvasTitle}
        </div>
        <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: "var(--doc-muted)" }}>
          {t.editor.emptyCanvasBody}
        </p>
      </div>
    );
  }
  return (
    <div ref={setNodeRef} className={cn("mt-6 flex h-16 items-center justify-center rounded-xl border-2 border-dashed text-xs transition-all", isOver ? "border-[var(--doc-accent)] bg-[var(--doc-accent-soft)] opacity-100" : "border-transparent opacity-0")}>
      {t.editor.dropHere}
    </div>
  );
}

export function EditorCanvas({ indicator }: { indicator: DropIndicator }) {
  const doc = useEditor((s) => s.doc)!;
  const selectedId = useEditor((s) => s.selectedId);
  const device = useEditor((s) => s.device);
  const updateProps = useEditor((s) => s.updateProps);

  const ctx = useMemo<RenderContextValue>(
    () => ({
      mode: "edit",
      locale: doc.language,
      theme: doc.theme,
      documentId: doc.id,
      canFill: false,
      onInlineEdit: (id, patch) => updateProps(id, patch, `inline:${id}`),
    }),
    [doc.language, doc.theme, doc.id, updateProps]
  );

  const ids = useMemo(() => doc.blocks.map((b) => b.id), [doc.blocks]);

  return (
    <motion.div layout transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className={cn("mx-auto w-full", device === "mobile" ? "max-w-[390px]" : "max-w-[1000px]")}>
      <div className={cn("overflow-hidden shadow-[0_1px_2px_rgba(11,18,32,.06),0_20px_50px_-12px_rgba(11,18,32,.18)] ring-1 ring-navy/5", device === "mobile" ? "rounded-[32px] border-[7px] border-navy" : "rounded-2xl")}>
        <DocumentSurface theme={doc.theme} language={doc.language} className="min-h-[70vh]">
          <RenderContext.Provider value={ctx}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {doc.blocks.map((block, i) => (
                <SortableBlock key={block.id} block={block} index={i} count={doc.blocks.length} selected={selectedId === block.id} indicator={indicator} />
              ))}
            </SortableContext>
            <EndDropZone empty={doc.blocks.length === 0} />
          </RenderContext.Provider>
        </DocumentSurface>
      </div>
    </motion.div>
  );
}
