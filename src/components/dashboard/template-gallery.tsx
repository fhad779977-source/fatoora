"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { LoaderCircle, Plus } from "lucide-react";
import { TEMPLATES, type TemplateId } from "@/lib/templates/catalog";
import { createDocument } from "@/lib/document";
import { useT } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";
import { DocumentThumbnail } from "@/components/document/document-thumbnail";

export function TemplateGallery({
  onPick,
  pending,
  includeBlank = true,
  className,
}: {
  onPick: (id: TemplateId) => void;
  pending?: TemplateId | null;
  includeBlank?: boolean;
  className?: string;
}) {
  const t = useT();
  // Build each template once so thumbnails render real blocks.
  const previews = useMemo(
    () => TEMPLATES.map((tpl) => ({ tpl, doc: createDocument({ title: tpl.title, theme: tpl.theme(), blocks: tpl.blocks() }) })),
    []
  );

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4", className)}>
      {includeBlank ? (
        <button
          type="button"
          onClick={() => onPick("blank")}
          disabled={!!pending}
          className="group flex flex-col overflow-hidden rounded-2xl border border-dashed border-copper/40 bg-card/40 text-start transition-all hover:-translate-y-0.5 hover:border-copper hover:shadow-lg hover:shadow-navy/5 disabled:opacity-60"
        >
          <div className="flex aspect-[4/3] items-center justify-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-copper-soft text-copper transition-transform group-hover:scale-110">
              {pending === "blank" ? <LoaderCircle className="size-5 animate-spin" /> : <Plus className="size-5" />}
            </span>
          </div>
          <div className="border-t border-dashed border-copper/30 p-3.5">
            <div className="text-sm font-semibold">{t.templates.blank}</div>
            <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.templates.blankDesc}</div>
          </div>
        </button>
      ) : null}
      {previews.map(({ tpl, doc }, i) => (
        <motion.button
          key={tpl.id}
          type="button"
          onClick={() => onPick(tpl.id)}
          disabled={!!pending}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.04 }}
          className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-start transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-copper/50 hover:shadow-xl hover:shadow-navy/8 disabled:opacity-60"
        >
          <div className="relative">
            <DocumentThumbnail doc={doc} maxBlocks={5} className="aspect-[4/3] w-full" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
            {pending === tpl.id ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <LoaderCircle className="size-6 animate-spin text-copper" />
              </div>
            ) : null}
          </div>
          <div className="flex items-start gap-2.5 border-t p-3.5">
            <tpl.icon className="mt-0.5 size-4 shrink-0 text-copper" />
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t.templates[tpl.nameKey]}</div>
              <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.templates[tpl.descKey]}</div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
