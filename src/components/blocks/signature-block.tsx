"use client";

import { useState } from "react";
import { BadgeCheck, PenLine } from "lucide-react";
import type { Block } from "@/lib/types";
import { dictionaries } from "@/lib/i18n/dictionary";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRenderContext } from "./context";
import { SignaturePad } from "./signature-pad";

export function SignatureBlock({ block }: { block: Block<"signature"> }) {
  const ctx = useRenderContext();
  const t = dictionaries[ctx.locale];
  const { label, signerName, signerRole, date, image } = block.props;
  const [open, setOpen] = useState(false);
  const signature = image || ctx.viewerSignatures?.[block.id];
  const canSign = ctx.mode === "view" && ctx.canFill && !signature && !!ctx.onSign;

  const justify = { start: "flex-start", center: "center", end: "flex-end", justify: "stretch" }[block.style.align];

  return (
    <div className="flex" style={{ justifyContent: justify }}>
      <div className="w-full max-w-sm" style={{ textAlign: "start" }}>
        <div className="mb-2 text-xs font-semibold tracking-wide" style={{ color: "var(--doc-muted)" }}>
          {label}
        </div>
        <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border" style={{ borderColor: "var(--doc-border)", borderStyle: signature ? "solid" : "dashed", background: signature ? "#FFFFFF" : "transparent" }}>
          {signature ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signature} alt={signerName} className="max-h-28 max-w-[90%] object-contain" />
              <span className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "var(--doc-accent-soft)", color: "var(--doc-accent)" }}>
                <BadgeCheck className="size-3" />
                {t.blockUi.signed}
              </span>
            </>
          ) : canSign ? (
            <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white" style={{ background: "var(--doc-accent)" }}>
              <PenLine className="size-4" />
              {t.blockUi.signHere}
            </button>
          ) : (
            <span className="text-sm" style={{ color: "var(--doc-muted)" }}>
              {t.blockUi.signatureEmpty}
            </span>
          )}
        </div>
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--doc-border)" }}>
          <div className="font-semibold">{signerName}</div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[13px]" style={{ color: "var(--doc-muted)" }}>
            {signerRole ? <span>{signerRole}</span> : null}
            {date ? <span dir="ltr">{date}</span> : null}
          </div>
        </div>
      </div>
      {canSign ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.inspector.drawSignature}</DialogTitle>
              <DialogDescription>{label} — {signerName}</DialogDescription>
            </DialogHeader>
            <SignaturePad
              labels={{ clear: t.inspector.clearSignature, save: t.inspector.saveSignature, hint: t.blockUi.signHere }}
              onSave={(url) => {
                ctx.onSign?.(block, url);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
