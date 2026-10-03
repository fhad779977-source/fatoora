"use client";

import { motion, type Variants } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import type { AnyBlock, Shadow, TextAlign } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isSafeUrl } from "./media";
import { useRenderContext } from "./context";

const SHADOWS: Record<Shadow, string> = {
  none: "none",
  sm: "0 1px 2px rgba(11,18,32,.06), 0 2px 8px rgba(11,18,32,.05)",
  md: "0 4px 10px rgba(11,18,32,.06), 0 14px 32px rgba(11,18,32,.08)",
  lg: "0 10px 24px rgba(11,18,32,.08), 0 30px 70px rgba(11,18,32,.14)",
};

export const ALIGN_TEXT: Record<TextAlign, CSSProperties["textAlign"]> = {
  start: "start",
  center: "center",
  end: "end",
  justify: "justify",
};

const VARIANTS: Record<AnyBlock["animation"], Variants | undefined> = {
  none: undefined,
  fade: { hidden: { opacity: 0 }, shown: { opacity: 1 } },
  "slide-up": { hidden: { opacity: 0, y: 28 }, shown: { opacity: 1, y: 0 } },
  zoom: { hidden: { opacity: 0, scale: 0.94 }, shown: { opacity: 1, scale: 1 } },
};

export function blockBoxStyle(block: AnyBlock): CSSProperties {
  const s = block.style;
  return {
    paddingBlock: s.paddingY,
    paddingInline: s.paddingX,
    background: s.background || undefined,
    border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor}` : undefined,
    borderRadius: s.borderRadius || undefined,
    boxShadow: SHADOWS[s.shadow],
    color: s.color || undefined,
    textAlign: ALIGN_TEXT[s.align],
    fontWeight: s.fontWeight,
    fontFamily: s.fontFamily ? (s.fontFamily === "serif" ? "var(--font-serif)" : "var(--font-sans)") : undefined,
  };
}

/** Outer wrapper: spacing, visual box, mobile visibility, click link and entrance animation. */
export function BlockShell({ block, children, className }: { block: AnyBlock; children: ReactNode; className?: string }) {
  const { mode } = useRenderContext();
  const style = blockBoxStyle(block);
  const hideClass = block.hideOnMobile && mode !== "edit" ? "@max-md/doc:hidden" : "";
  const clickable = mode === "view" && isSafeUrl(block.href);
  const variants = mode === "view" ? VARIANTS[block.animation] : undefined;

  const inner = (
    <div
      data-block-id={block.id}
      data-block-type={block.type}
      className={cn("relative print-avoid-break", block.hideOnMobile && mode === "edit" && "@max-md/doc:opacity-40", className)}
      style={style}
    >
      {children}
    </div>
  );

  const content = clickable ? (
    <div
      role="link"
      tabIndex={0}
      className="cursor-pointer transition-opacity hover:opacity-90"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button,input,textarea,select,iframe,video")) return;
        window.open(block.href, "_blank", "noopener,noreferrer");
      }}
      onKeyDown={(e) => e.key === "Enter" && window.open(block.href, "_blank", "noopener,noreferrer")}
    >
      {inner}
    </div>
  ) : (
    inner
  );

  if (variants) {
    return (
      <motion.div
        className={cn("motion-reveal", hideClass)}
        style={{ marginBlock: block.style.marginY }}
        variants={variants}
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {content}
      </motion.div>
    );
  }
  return (
    <div className={hideClass} style={{ marginBlock: block.style.marginY }} data-export-block={mode === "export" ? "" : undefined}>
      {content}
    </div>
  );
}
