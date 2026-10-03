"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Ellipsis, Eye, FileDown, FileJson, PencilLine, SquarePen, Trash2 } from "lucide-react";
import type { MidadDocument } from "@/lib/types";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { relativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DocumentThumbnail } from "@/components/document/document-thumbnail";

export type DocumentAction = "open" | "preview" | "duplicate" | "rename" | "export" | "exportFile" | "delete";

export function DocumentCard({ doc, onAction, index = 0 }: { doc: MidadDocument; onAction: (action: DocumentAction, doc: MidadDocument) => void; index?: number }) {
  const t = useT();
  const { locale } = useLocale();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.03 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-[box-shadow,border-color] duration-300 hover:border-copper/40 hover:shadow-xl hover:shadow-navy/6"
    >
      <Link href={`/editor/${doc.id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring/40" aria-label={`${t.common.open}: ${doc.title}`}>
        <DocumentThumbnail doc={doc} maxBlocks={5} className="aspect-[16/10] w-full border-b" />
      </Link>
      <div className="flex items-start gap-2 p-4">
        <div className="min-w-0 flex-1">
          <Link href={`/editor/${doc.id}`} className="line-clamp-1 font-semibold hover:text-copper">
            {doc.title || t.common.untitled}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Badge variant={doc.status === "published" ? "copper" : "muted"}>{t.dashboard.status[doc.status]}</Badge>
            <span>
              {t.dashboard.updatedAgo} {relativeTime(doc.updatedAt, locale)}
            </span>
            <span aria-hidden>·</span>
            <span>
              {doc.blocks.length} {t.common.blocksCount}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="-me-1.5 shrink-0" aria-label="actions">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onAction("open", doc)}>
              <SquarePen />
              {t.common.open}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("preview", doc)}>
              <Eye />
              {t.common.preview}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("duplicate", doc)}>
              <Copy />
              {t.common.duplicate}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("rename", doc)}>
              <PencilLine />
              {t.common.rename}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("export", doc)}>
              <FileDown />
              {t.common.exportPdf}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("exportFile", doc)}>
              <FileJson />
              {t.dashboard.exportFile}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onAction("delete", doc)}>
              <Trash2 />
              {t.common.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
