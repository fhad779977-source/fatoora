"use client";

import { useMemo, useState } from "react";
import { useClientValue } from "@/hooks/use-client-value";
import { Check, Copy, ExternalLink, Eye, Globe, MessageSquare, PenLine } from "lucide-react";
import { toast } from "sonner";
import type { DocumentPermissions, MidadDocument, ShareAccess } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";
import { buildShareUrl } from "@/lib/share";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogoMark } from "@/components/brand/logo";

export function ShareDialog({
  doc,
  open,
  onOpenChange,
  onUpdate,
}: {
  doc: MidadDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (patch: Partial<MidadDocument>) => void;
}) {
  const t = useT();
  const [embed, setEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = useClientValue(() => window.location.origin, "");

  const share = useMemo(() => (origin ? buildShareUrl(origin, doc, embed) : { url: "", tooLarge: false }), [origin, doc, embed]);
  const perms = doc.permissions;
  const setPerms = (patch: Partial<DocumentPermissions>) => onUpdate({ permissions: { ...perms, ...patch } });

  const excerpt = useMemo(() => {
    const text = doc.blocks.find((b) => b.type === "text");
    return text && text.type === "text" ? text.props.text.slice(0, 120) : t.brand.tagline;
  }, [doc.blocks, t.brand.tagline]);
  const host = origin.replace(/^https?:\/\//, "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share.url);
    } catch {
      const el = document.getElementById("share-url") as HTMLInputElement | null;
      el?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    toast.success(t.share.linkCopied);
    setTimeout(() => setCopied(false), 1800);
  };

  const accessOptions: { id: ShareAccess; label: string; desc: string; icon: typeof Eye }[] = [
    { id: "view", label: t.share.accessView, desc: t.share.accessViewDesc, icon: Eye },
    { id: "fill", label: t.share.accessFill, desc: t.share.accessFillDesc, icon: PenLine },
    { id: "comment", label: t.share.accessComment, desc: t.share.accessCommentDesc, icon: MessageSquare },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.share.title}</DialogTitle>
          <DialogDescription>{t.share.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="share-url">{t.share.link}</Label>
          <div className="flex gap-2">
            <Input id="share-url" readOnly value={share.url} dir="ltr" className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={copy} variant="copper" className="shrink-0">
              {copied ? <Check /> : <Copy />}
              <span className="hidden sm:inline">{t.share.copyLink}</span>
            </Button>
          </div>
          <label className="flex items-start justify-between gap-4 rounded-xl border p-3">
            <span>
              <span className="block text-sm font-medium">{t.share.embed}</span>
              <span className="block text-xs text-muted-foreground">{share.tooLarge ? t.share.embedTooLarge : t.share.embedDesc}</span>
            </span>
            <Switch checked={embed} onCheckedChange={setEmbed} />
          </label>
        </div>

        <div className="space-y-2">
          <Label>{t.share.access}</Label>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
            {accessOptions.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={perms.access === o.id}
                onClick={() => setPerms({ access: o.id })}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-start transition-all",
                  perms.access === o.id ? "border-copper bg-copper-soft ring-2 ring-copper/20" : "hover:border-copper/40 hover:bg-accent/60"
                )}
              >
                <o.icon className={cn("size-4", perms.access === o.id ? "text-copper" : "text-muted-foreground")} />
                <span className="text-sm font-semibold">{o.label}</span>
                <span className="text-xs leading-snug text-muted-foreground">{o.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y rounded-xl border">
          <label className="flex items-center justify-between gap-4 p-3 text-sm font-medium">
            {t.share.allowDownload}
            <Switch checked={perms.allowDownload} onCheckedChange={(v) => setPerms({ allowDownload: v })} />
          </label>
          <label className="flex items-center justify-between gap-4 p-3 text-sm font-medium">
            {t.share.allowPrint}
            <Switch checked={perms.allowPrint} onCheckedChange={(v) => setPerms({ allowPrint: v })} />
          </label>
          <label className="flex items-center justify-between gap-4 p-3 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              {t.share.publish}
            </span>
            <Switch checked={doc.status === "published"} onCheckedChange={(v) => onUpdate({ status: v ? "published" : "draft" })} />
          </label>
        </div>

        <div className="space-y-2">
          <Label>{t.share.previewCard}</Label>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex h-24 items-end justify-between bg-navy p-4 paper-grain">
              <LogoMark className="size-8" />
              <span className="text-[10px] font-semibold tracking-[0.3em] text-copper">MIDAD</span>
            </div>
            <div className="space-y-1 p-4">
              <div className="text-[11px] text-muted-foreground" dir="ltr">
                {host}
              </div>
              <div className="line-clamp-1 font-semibold">{doc.title || t.common.untitled}</div>
              <div className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs leading-relaxed text-muted-foreground">{t.share.mvpNote}</p>
          <Button variant="outline" asChild className="shrink-0">
            <a href={share.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {t.share.openLink}
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
