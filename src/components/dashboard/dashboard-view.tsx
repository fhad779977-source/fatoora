"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, FilePlus2, FileText, FileUp, Layers, LoaderCircle, PencilLine, Search, X } from "lucide-react";
import { toast } from "sonner";
import type { MidadDocument } from "@/lib/types";
import { useDocuments } from "@/lib/stores/documents-store";
import { useSettings } from "@/lib/stores/settings-store";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { format } from "@/lib/i18n/dictionary";
import { relativeTime, safeFileName } from "@/lib/format";
import { documentFromText } from "@/lib/import";
import { useCreateDocument } from "@/hooks/use-create-document";
import { useClientValue } from "@/hooks/use-client-value";
import { AppHeader } from "@/components/shared/app-header";
import { ExportPdfDialog } from "@/components/shared/export-pdf-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DocumentCard, type DocumentAction } from "./document-card";
import { TemplateGallery } from "./template-gallery";
import { ComparePoints } from "./compare-card";

type SortKey = "updated" | "created" | "title";

export function DashboardView() {
  const t = useT();
  const { locale, dir } = useLocale();
  const router = useRouter();
  const { documents, status, load, duplicate, rename, remove, importDocument } = useDocuments();
  const userName = useSettings((s) => s.userName);
  const setUserName = useSettings((s) => s.setUserName);
  const { createDocument, pending } = useCreateDocument();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [renaming, setRenaming] = useState<MidadDocument | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<MidadDocument | null>(null);
  const [exporting, setExporting] = useState<MidadDocument | null>(null);
  const [importing, setImporting] = useState(false);
  const hour = useClientValue<number | null>(() => new Date().getHours(), null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? documents.filter((d) => d.title.toLowerCase().includes(q) || d.blocks.some((b) => b.type === "text" && b.props.text.toLowerCase().includes(q)))
      : documents;
    return [...list].sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title, locale) : sort === "created" ? b.createdAt.localeCompare(a.createdAt) : b.updatedAt.localeCompare(a.updatedAt)
    );
  }, [documents, query, sort, locale]);

  const recent = documents.slice(0, 3);
  const totalBlocks = documents.reduce((n, d) => n + d.blocks.length, 0);
  const greeting = hour !== null && hour >= 4 && hour < 12 ? t.dashboard.greetingMorning : t.dashboard.greetingEvening;
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const onAction = async (action: DocumentAction, doc: MidadDocument) => {
    switch (action) {
      case "open":
        router.push(`/editor/${doc.id}`);
        break;
      case "preview":
        router.push(`/view/${doc.id}`);
        break;
      case "duplicate": {
        const copy = await duplicate(doc.id, t.dashboard.copySuffix);
        if (copy) toast.success(t.dashboard.duplicated, { description: copy.title });
        break;
      }
      case "rename":
        setRenameValue(doc.title);
        setRenaming(doc);
        break;
      case "export":
        setExporting(doc);
        break;
      case "exportFile": {
        const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${safeFileName(doc.title)}.midad.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        break;
      }
      case "delete":
        setDeleting(doc);
        break;
    }
  };

  const onImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const doc = file.name.toLowerCase().endsWith(".json") ? await importDocument(JSON.parse(text)) : await useDocuments.getState().create(documentFromText(text, file.name, locale));
      toast.success(t.dashboard.imported, { description: doc.title });
      router.push(`/editor/${doc.id}`);
    } catch (e) {
      console.error(e);
      toast.error(t.dashboard.importFailed);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <input ref={fileRef} type="file" accept=".json,.md,.markdown,.txt,application/json,text/plain,text/markdown" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        {/* Hero */}
        <section className="grid gap-6 pt-8 pb-10 lg:grid-cols-[1.5fr_1fr] lg:pt-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block size-1.5 rounded-full bg-copper" />
                {t.dashboard.welcome}
              </div>
              <h1 className="mt-3 font-display text-4xl leading-tight font-semibold sm:text-5xl">
                {greeting}
                {userName ? <span className="text-copper">، {userName}</span> : null}
              </h1>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                    <PencilLine className="size-3.5" />
                    {userName ? t.common.edit : t.dashboard.setName}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64">
                  <Input autoFocus defaultValue={userName} placeholder={t.dashboard.namePlaceholder} onChange={(e) => setUserName(e.target.value.slice(0, 32))} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="default" onClick={() => createDocument("blank")} disabled={!!pending}>
                {pending === "blank" ? <LoaderCircle className="animate-spin" /> : <FilePlus2 />}
                {t.dashboard.create}
              </Button>
              <Button size="lg" variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
                {importing ? <LoaderCircle className="animate-spin" /> : <FileUp />}
                {t.dashboard.import}
              </Button>
            </div>
            <p className="-mt-5 text-xs text-muted-foreground">{t.dashboard.importHint}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-2xl bg-navy p-5 text-ivory">
              <div className="text-xs text-slate-blue">{t.dashboard.totalDocs}</div>
              <div className="mt-1 flex items-end justify-between">
                <span className="font-display text-5xl font-semibold tabular-nums">{status === "ready" ? documents.length : "—"}</span>
                <FileText className="mb-2 size-6 text-copper" />
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {t.dashboard.lastEdited}
              </div>
              <div className="mt-2 line-clamp-1 text-sm font-semibold">{documents[0]?.title ?? "—"}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{documents[0] ? relativeTime(documents[0].updatedAt, locale) : ""}</div>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers className="size-3.5" />
                {t.dashboard.blocksTotal}
              </div>
              <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{status === "ready" ? totalBlocks : "—"}</div>
            </div>
          </motion.div>
        </section>

        {/* Recent */}
        {recent.length > 0 ? (
          <section className="mb-12">
            <SectionTitle title={t.dashboard.recent} />
            <div className="grid gap-3 md:grid-cols-3">
              {recent.map((d) => (
                <Link key={d.id} href={`/editor/${d.id}`} className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-copper/40">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-copper-soft text-copper">
                    <FileText className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{d.title || t.common.untitled}</span>
                    <span className="block text-xs text-muted-foreground">{relativeTime(d.updatedAt, locale)}</span>
                  </span>
                  <Arrow className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Templates */}
        <section className="mb-14">
          <SectionTitle title={t.dashboard.templates} hint={t.dashboard.templatesHint} />
          <TemplateGallery onPick={createDocument} pending={pending} />
        </section>

        {/* Documents */}
        <section className="mb-14" id="documents">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle title={t.dashboard.all} className="mb-0" />
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-72">
                <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.dashboard.search} className="ps-9" aria-label={t.dashboard.search} />
                {query ? (
                  <button className="absolute inset-y-0 end-2 my-auto flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent" onClick={() => setQuery("")} aria-label={t.dashboard.clearSearch}>
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-40 shrink-0" aria-label={t.dashboard.sort}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">{t.dashboard.sortUpdated}</SelectItem>
                  <SelectItem value="created">{t.dashboard.sortCreated}</SelectItem>
                  <SelectItem value="title">{t.dashboard.sortTitle}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {status !== "ready" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="overflow-hidden rounded-2xl border bg-card">
                  <div className="aspect-[16/10] animate-pulse bg-muted" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState onCreate={() => createDocument("blank")} onImport={() => fileRef.current?.click()} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed py-16 text-center">
              <Search className="size-8 text-muted-foreground/60" />
              <div className="mt-4 font-semibold">{t.dashboard.noResults}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t.dashboard.noResultsBody}</div>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setQuery("")}>
                {t.dashboard.clearSearch}
              </Button>
            </div>
          ) : (
            <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((d, i) => (
                  <DocumentCard key={d.id} doc={d} onAction={onAction} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Smart vs PDF */}
        <section className="rounded-3xl border bg-card/50 p-5 sm:p-8">
          <SectionTitle title={t.dashboard.compareTitle} hint={t.dashboard.compareBody} />
          <ComparePoints />
        </section>
      </main>

      {/* Rename */}
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!renaming) return;
              await rename(renaming.id, renameValue.trim() || t.common.untitled);
              toast.success(t.dashboard.renamed);
              setRenaming(null);
            }}
          >
            <DialogHeader>
              <DialogTitle>{t.dashboard.renameTitle}</DialogTitle>
              <DialogDescription className="sr-only">{t.dashboard.renameTitle}</DialogDescription>
            </DialogHeader>
            <Input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenaming(null)}>
                {t.common.cancel}
              </Button>
              <Button type="submit">{t.common.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dashboard.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{format(t.dashboard.deleteBody, { title: deleting?.title || t.common.untitled })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                await remove(deleting.id);
                toast.success(t.dashboard.deleted);
                setDeleting(null);
              }}
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExportPdfDialog doc={exporting} open={!!exporting} onOpenChange={(o) => !o && setExporting(null)} />
    </div>
  );
}

function SectionTitle({ title, hint, className }: { title: string; hint?: string; className?: string }) {
  return (
    <div className={className ?? "mb-5"}>
      <h2 className="font-display text-2xl font-semibold sm:text-[28px]">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function EmptyState({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  const t = useT();
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed bg-card/40 px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 paper-grain opacity-60" />
      <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-navy text-copper shadow-xl shadow-navy/20">
        <FileText className="size-7" />
      </div>
      <h3 className="relative mt-5 font-display text-2xl font-semibold">{t.dashboard.emptyTitle}</h3>
      <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t.dashboard.emptyBody}</p>
      <div className="relative mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onCreate}>
          <FilePlus2 />
          {t.dashboard.create}
        </Button>
        <Button variant="outline" onClick={onImport}>
          <FileUp />
          {t.dashboard.import}
        </Button>
      </div>
    </div>
  );
}
