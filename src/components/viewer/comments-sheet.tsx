"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import type { DocumentComment } from "@/lib/types";
import { getRepository } from "@/lib/storage/idb-repository";
import { uid } from "@/lib/ids";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { relativeTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function CommentsSheet({ documentId, open, onOpenChange }: { documentId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (open) getRepository().listComments(documentId).then(setComments);
  }, [open, documentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    const comment: DocumentComment = { id: uid("c"), documentId, author: name.trim() || "—", body: body.trim(), createdAt: new Date().toISOString() };
    await getRepository().addComment(comment);
    setComments((c) => [...c, comment]);
    setBody("");
    toast.success(t.viewer.commentAdded);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end" className="w-full sm:max-w-md">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{t.viewer.comments}</SheetTitle>
          <SheetDescription className="sr-only">{t.viewer.comments}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 scrollbar-thin">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-muted-foreground">
              <MessageSquare className="size-8 opacity-50" />
              {t.viewer.commentsEmpty}
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-xl border bg-card p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="flex size-7 items-center justify-center rounded-full bg-copper-soft text-xs text-copper">{c.author.slice(0, 1)}</span>
                    {c.author}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{relativeTime(c.createdAt, locale)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{c.body}</p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={submit} className="space-y-2 border-t p-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.viewer.commentName} />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t.viewer.commentPlaceholder} rows={3} />
          <Button type="submit" variant="copper" className="w-full" disabled={!body.trim()}>
            <Send className="rtl:-scale-x-100" />
            {t.viewer.commentSend}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
