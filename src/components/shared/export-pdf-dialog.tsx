"use client";

import { useState } from "react";
import { FileDown, GalleryHorizontal, LoaderCircle, RectangleVertical, ScrollText } from "lucide-react";
import { toast } from "sonner";
import type { MidadDocument, PageSize } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ExportPdfDialog({ doc, open, onOpenChange }: { doc: MidadDocument | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const [size, setSize] = useState<PageSize>("a4");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const options: { id: PageSize; label: string; desc: string; icon: typeof RectangleVertical }[] = [
    { id: "a4", label: t.pdf.a4, desc: t.pdf.a4Desc, icon: RectangleVertical },
    { id: "presentation", label: t.pdf.presentation, desc: t.pdf.presentationDesc, icon: GalleryHorizontal },
    { id: "long", label: t.pdf.long, desc: t.pdf.longDesc, icon: ScrollText },
  ];

  const run = async () => {
    if (!doc) return;
    setBusy(true);
    try {
      const { exportDocumentToPdf } = await import("@/lib/pdf/export-pdf");
      const result = await exportDocumentToPdf(doc, size, name.trim() || doc.title || t.common.untitled);
      toast.success(t.pdf.success, { description: result.name });
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(t.pdf.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return;
        if (o) setName(doc?.title || "");
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.pdf.title}</DialogTitle>
          <DialogDescription>{t.pdf.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{t.pdf.pageSize}</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSize(o.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-3 text-start transition-all",
                  size === o.id ? "border-copper bg-copper-soft ring-2 ring-copper/20" : "hover:border-copper/40 hover:bg-accent/60"
                )}
              >
                <o.icon className={cn("size-5", size === o.id ? "text-copper" : "text-muted-foreground")} />
                <span className="text-sm font-semibold">{o.label}</span>
                <span className="text-xs leading-snug text-muted-foreground">{o.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pdf-name">{t.pdf.fileName}</Label>
          <div className="relative">
            <Input id="pdf-name" value={name} onChange={(e) => setName(e.target.value)} className="pe-12" />
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground">.pdf</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t.common.cancel}
          </Button>
          <Button variant="copper" onClick={run} disabled={busy || !doc}>
            {busy ? <LoaderCircle className="animate-spin" /> : <FileDown />}
            {busy ? t.pdf.exporting : t.pdf.download}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
