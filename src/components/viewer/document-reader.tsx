"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Check, FileDown, MessageSquare, Pencil, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { MidadDocument } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";
import { useDocuments } from "@/lib/stores/documents-store";
import { useDocumentInteractions } from "@/hooks/use-interactions";
import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { DocumentSurface } from "@/components/document/document-surface";
import { DocumentRenderer } from "@/components/document/document-renderer";
import { ExportPdfDialog } from "@/components/shared/export-pdf-dialog";
import { ShareDialog } from "@/components/shared/share-dialog";
import { LocaleToggle, ThemeToggle } from "@/components/shared/preferences";
import { CommentsSheet } from "./comments-sheet";

/** Clean, tool-free reading experience for a document. */
export function DocumentReader({ doc: initial, variant, embedded = false }: { doc: MidadDocument; variant: "owner" | "shared"; embedded?: boolean }) {
  const t = useT();
  const [doc, setDoc] = useState(initial);
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  const interactions = useDocumentInteractions(embedded ? undefined : doc.id);

  const owner = variant === "owner";
  const perms = doc.permissions;
  const canFill = owner || perms.access !== "view";
  const canComment = owner || perms.access === "comment";
  const canDownload = owner || perms.allowDownload;
  const canPrint = owner || perms.allowPrint;

  const share = async () => {
    if (owner) return setShareOpen(true);
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: doc.title, url });
        return;
      } catch {
        /* cancelled — fall back to copy */
      }
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    toast.success(t.share.linkCopied);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-dvh" style={{ background: doc.theme.background }}>
      <motion.div className="fixed inset-x-0 top-0 z-50 h-[3px] origin-[0%] bg-copper print-hidden rtl:origin-[100%]" style={{ scaleX: progress }} aria-label={t.viewer.readingProgress} />

      <header className="sticky top-0 z-40 border-b border-black/5 bg-background/80 backdrop-blur-xl print-hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3 sm:px-6">
          <Link href={owner ? "/dashboard" : "/"} aria-label={t.brand.name} className="shrink-0">
            <LogoMark className="size-8" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{doc.title}</div>
            <div className="text-[11px] text-muted-foreground">{owner ? t.viewer.owner : embedded ? t.viewer.embeddedNote : t.viewer.sharedView}</div>
          </div>
          <div className="flex items-center gap-1">
            <LocaleToggle compact className="hidden sm:inline-flex" />
            <ThemeToggle className="hidden sm:inline-flex" />
            {canComment && !embedded ? (
              <Hint label={t.viewer.comments}>
                <Button variant="ghost" size="icon-sm" onClick={() => setCommentsOpen(true)} aria-label={t.viewer.comments}>
                  <MessageSquare />
                </Button>
              </Hint>
            ) : null}
            {canPrint ? (
              <Hint label={t.common.print}>
                <Button variant="ghost" size="icon-sm" onClick={() => window.print()} aria-label={t.common.print}>
                  <Printer />
                </Button>
              </Hint>
            ) : null}
            <Hint label={t.common.share}>
              <Button variant="ghost" size="icon-sm" onClick={share} aria-label={t.common.share}>
                {copied ? <Check /> : <Share2 />}
              </Button>
            </Hint>
            {canDownload ? (
              <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
                <FileDown />
                <span className="hidden sm:inline">{t.common.downloadPdf}</span>
              </Button>
            ) : null}
            {owner ? (
              <Button size="sm" asChild>
                <Link href={`/editor/${doc.id}`}>
                  <Pencil />
                  <span className="hidden sm:inline">{t.viewer.backToEditor}</span>
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main>
        <DocumentSurface theme={doc.theme} language={doc.language} className="print-page">
          <DocumentRenderer doc={doc} mode="view" canFill={canFill} {...interactions} />
        </DocumentSurface>
      </main>

      <footer className="border-t border-black/5 py-10 print-hidden" style={{ background: doc.theme.background, color: doc.theme.mutedColor }}>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 text-center text-sm">
          <Link href="/" className="inline-flex items-center gap-2 font-medium">
            <LogoMark className="size-6" />
            {t.viewer.madeWith}
          </Link>
          {doc.status === "published" ? <Badge variant="copper">{t.share.published}</Badge> : null}
          {!owner ? (
            <Link href="/dashboard" className="text-xs underline-offset-4 hover:underline" style={{ color: doc.theme.accentColor }}>
              {t.viewer.createYours}
            </Link>
          ) : null}
        </div>
      </footer>

      <ExportPdfDialog doc={doc} open={exportOpen} onOpenChange={setExportOpen} />
      {owner ? (
        <ShareDialog
          doc={doc}
          open={shareOpen}
          onOpenChange={setShareOpen}
          onUpdate={(patch) => {
            const next = { ...doc, ...patch, updatedAt: new Date().toISOString() };
            setDoc(next);
            useDocuments.getState().save(next);
          }}
        />
      ) : null}
      {canComment && !embedded ? <CommentsSheet documentId={doc.id} open={commentsOpen} onOpenChange={setCommentsOpen} /> : null}
    </div>
  );
}
