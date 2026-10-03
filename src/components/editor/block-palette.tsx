"use client";

import { useDraggable } from "@dnd-kit/core";
import type { BlockType } from "@/lib/types";
import { BLOCK_ICONS, BLOCK_ORDER } from "@/lib/blocks/registry";
import { useT } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";

function PaletteItem({ type, onAdd, draggable }: { type: BlockType; onAdd: (type: BlockType) => void; draggable: boolean }) {
  const t = useT();
  const Icon = BLOCK_ICONS[type];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${type}`, data: { source: "palette", type }, disabled: !draggable });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      onClick={() => onAdd(type)}
      className={cn(
        "group flex flex-col items-center justify-center gap-2 rounded-xl border bg-card px-2 py-3.5 text-center text-xs font-medium transition-all hover:-translate-y-px hover:border-copper/50 hover:shadow-md hover:shadow-navy/5 active:scale-[0.98]",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/70 transition-colors group-hover:bg-copper-soft group-hover:text-copper">
        <Icon className="size-[18px]" />
      </span>
      {t.blocks[type]}
    </button>
  );
}

export function BlockPalette({ onAdd, draggable = true, className }: { onAdd: (type: BlockType) => void; draggable?: boolean; className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {BLOCK_ORDER.map((type) => (
        <PaletteItem key={type} type={type} onAdd={onAdd} draggable={draggable} />
      ))}
    </div>
  );
}

export function PaletteChip({ type }: { type: BlockType }) {
  const t = useT();
  const Icon = BLOCK_ICONS[type];
  return (
    <div className="flex items-center gap-2 rounded-xl border border-copper/40 bg-card px-3 py-2 text-sm font-medium shadow-2xl shadow-navy/20">
      <Icon className="size-4 text-copper" />
      {t.blocks[type]}
    </div>
  );
}
