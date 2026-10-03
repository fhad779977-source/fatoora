"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { DocumentVersion } from "@/lib/types";
import { useEditor } from "@/lib/stores/editor-store";
import { getRepository } from "@/lib/storage/idb-repository";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatDate, formatTime, relativeTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function HistoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const { locale } = useLocale();
  const docId = useEditor((s) => s.doc?.id);
  const [versions, setVersions] = useState<DocumentVersion[] | null>(null);

  useEffect(() => {
    if (open && docId) getRepository().listVersions(docId).then(setVersions);
  }, [open, docId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.editor.history}</DialogTitle>
          <DialogDescription className="sr-only">{t.editor.history}</DialogDescription>
        </DialogHeader>
        {!versions ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            <History className="size-7 opacity-60" />
            {t.editor.historyEmpty}
          </div>
        ) : (
          <ul className="max-h-[50vh] divide-y overflow-y-auto rounded-xl border scrollbar-thin">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {formatDate(v.savedAt, locale)} · <span dir="ltr">{formatTime(v.savedAt, locale)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {relativeTime(v.savedAt, locale)} · {v.snapshot.blocks.length} {t.common.blocksCount}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    useEditor.getState().replaceDoc(structuredClone(v.snapshot));
                    toast.success(t.editor.restored);
                    onOpenChange(false);
                  }}
                >
                  <RotateCcw />
                  {t.editor.restore}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
