"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImageUp, PenLine, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { AnyBlock, Block, BlockPropsMap, BlockType, FormField } from "@/lib/types";
import { useEditor } from "@/lib/stores/editor-store";
import { useT } from "@/lib/i18n/use-t";
import { uid } from "@/lib/ids";
import { imageFileToDataUrl, readAsDataUrl } from "@/lib/files";
import { cn } from "@/lib/utils";
import { CARD_ICONS } from "@/components/blocks/icons";
import { formatBytes } from "@/components/blocks/media";
import { SignaturePad } from "@/components/blocks/signature-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Section, Segmented, SliderField } from "./controls";

const MAX_FILE = 8 * 1024 * 1024;

function useProps<T extends BlockType>(block: Block<T>) {
  const updateProps = useEditor((s) => s.updateProps);
  return (patch: Partial<BlockPropsMap[T]>) => updateProps<T>(block.id, patch);
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px] font-medium text-foreground/80">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function UploadButton({ accept, onFile, label, icon: Icon = Upload }: { accept: string; onFile: (f: File) => void; label: string; icon?: typeof Upload }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
        e.target.value = "";
      }} />
      <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => ref.current?.click()}>
        <Icon />
        {label}
      </Button>
    </>
  );
}

function HeadingEditor({ block }: { block: Block<"heading"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <Field label={t.inspector.text}>
        <Textarea rows={2} value={block.props.text} onChange={(e) => set({ text: e.target.value })} />
      </Field>
      <Field label={t.inspector.level}>
        <Segmented value={String(block.props.level) as "1" | "2" | "3"} onChange={(v) => set({ level: Number(v) as 1 | 2 | 3 })} options={[{ value: "1", label: "H1" }, { value: "2", label: "H2" }, { value: "3", label: "H3" }]} />
      </Field>
      <Field label={t.inspector.eyebrow}>
        <Input value={block.props.eyebrow ?? ""} onChange={(e) => set({ eyebrow: e.target.value })} />
      </Field>
    </>
  );
}

function TextEditor({ block }: { block: Block<"text"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <Field label={t.inspector.text}>
      <Textarea rows={8} value={block.props.text} onChange={(e) => set({ text: e.target.value })} />
    </Field>
  );
}

function ImageEditor({ block }: { block: Block<"image"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <Field label={t.inspector.imageSource}>
        {block.props.src ? (
          <div className="relative overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.props.src} alt="" className="h-28 w-full object-cover" />
            <button type="button" onClick={() => set({ src: "" })} className="absolute top-1.5 end-1.5 rounded-md bg-navy/80 p-1 text-ivory" aria-label={t.common.remove}>
              <X className="size-3.5" />
            </button>
          </div>
        ) : null}
        <UploadButton
          accept="image/*"
          icon={ImageUp}
          label={t.common.upload}
          onFile={async (f) => {
            try {
              set({ src: await imageFileToDataUrl(f), alt: block.props.alt || f.name.replace(/\.[^.]+$/, "") });
            } catch {
              toast.error(t.common.error);
            }
          }}
        />
        <Input dir="ltr" placeholder="https://…" value={block.props.src.startsWith("data:") ? "" : block.props.src} onChange={(e) => set({ src: e.target.value })} aria-label={t.inspector.imageUrl} />
      </Field>
      <Field label={t.inspector.alt}>
        <Input value={block.props.alt} onChange={(e) => set({ alt: e.target.value })} />
      </Field>
      <Field label={t.inspector.caption}>
        <Input value={block.props.caption ?? ""} onChange={(e) => set({ caption: e.target.value })} />
      </Field>
      <Field label={t.inspector.fit}>
        <Segmented value={block.props.fit} onChange={(v) => set({ fit: v })} options={[{ value: "cover", label: t.inspector.fitCover }, { value: "contain", label: t.inspector.fitContain }]} />
      </Field>
      <SliderField label={t.inspector.height} value={block.props.height} min={120} max={720} step={10} onChange={(v) => set({ height: v })} />
    </>
  );
}

function VideoEditor({ block }: { block: Block<"video"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <Field label={t.inspector.videoUrl}>
        <Input dir="ltr" placeholder="https://www.youtube.com/watch?v=…" value={block.props.url} onChange={(e) => set({ url: e.target.value })} />
      </Field>
      <Field label={t.inspector.title}>
        <Input value={block.props.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <Field label={t.inspector.caption}>
        <Input value={block.props.caption ?? ""} onChange={(e) => set({ caption: e.target.value })} />
      </Field>
    </>
  );
}

function ButtonEditor({ block }: { block: Block<"button"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <Field label={t.inspector.label}>
        <Input value={block.props.label} onChange={(e) => set({ label: e.target.value })} />
      </Field>
      <Field label={t.inspector.url}>
        <Input dir="ltr" value={block.props.url} onChange={(e) => set({ url: e.target.value })} placeholder="https:// · mailto: · tel:" />
      </Field>
      <Field label={t.inspector.variant}>
        <Segmented value={block.props.variant} onChange={(v) => set({ variant: v })} options={[{ value: "solid", label: t.inspector.solid }, { value: "outline", label: t.inspector.outline }]} />
      </Field>
      <SwitchRow label={t.inspector.newTab} checked={block.props.newTab} onChange={(v) => set({ newTab: v })} />
    </>
  );
}

function LinkEditor({ block }: { block: Block<"link"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <Field label={t.inspector.label}>
        <Input value={block.props.label} onChange={(e) => set({ label: e.target.value })} />
      </Field>
      <Field label={t.inspector.url}>
        <Input dir="ltr" value={block.props.url} onChange={(e) => set({ url: e.target.value })} />
      </Field>
      <Field label={t.inspector.description}>
        <Textarea rows={2} value={block.props.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
      </Field>
    </>
  );
}

function TableEditor({ block }: { block: Block<"table"> }) {
  const t = useT();
  const set = useProps(block);
  const { headers, rows } = block.props;
  const setCell = (r: number, c: number, v: string) => set({ rows: rows.map((row, i) => (i === r ? headers.map((_, j) => (j === c ? v : row[j] ?? "")) : row)) });
  return (
    <>
      <Field
        label={t.inspector.headers}
        action={
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => set({ headers: [...headers, `${t.inspector.cellPlaceholder} ${headers.length + 1}`], rows: rows.map((r) => [...r, ""]) })}>
            <Plus className="size-3" />
            {t.inspector.addColumn}
          </Button>
        }
      >
        <div className="space-y-1.5">
          {headers.map((h, c) => (
            <div key={c} className="flex gap-1.5">
              <Input value={h} className="h-8" onChange={(e) => set({ headers: headers.map((x, i) => (i === c ? e.target.value : x)) })} />
              <Button type="button" variant="ghost" size="icon-sm" disabled={headers.length <= 1} onClick={() => set({ headers: headers.filter((_, i) => i !== c), rows: rows.map((r) => r.filter((_, i) => i !== c)) })} aria-label={t.common.remove}>
                <X />
              </Button>
            </div>
          ))}
        </div>
      </Field>
      <Field
        label={t.inspector.rows}
        action={
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => set({ rows: [...rows, headers.map(() => "")] })}>
            <Plus className="size-3" />
            {t.inspector.addRow}
          </Button>
        }
      >
        <div className="space-y-2">
          {rows.map((row, r) => (
            <div key={r} className="rounded-lg border bg-muted/30 p-1.5">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(headers.length, 2)}, minmax(0,1fr))` }}>
                {headers.map((h, c) => (
                  <Input key={c} value={row[c] ?? ""} placeholder={h} className="h-8 bg-card text-xs" onChange={(e) => setCell(r, c, e.target.value)} />
                ))}
              </div>
              <div className="mt-1 flex justify-end gap-0.5">
                <Button type="button" variant="ghost" size="icon-sm" className="size-6" disabled={r === 0} onClick={() => { const n = [...rows]; [n[r - 1], n[r]] = [n[r], n[r - 1]]; set({ rows: n }); }} aria-label="up"><ArrowUp className="size-3" /></Button>
                <Button type="button" variant="ghost" size="icon-sm" className="size-6" disabled={r === rows.length - 1} onClick={() => { const n = [...rows]; [n[r + 1], n[r]] = [n[r], n[r + 1]]; set({ rows: n }); }} aria-label="down"><ArrowDown className="size-3" /></Button>
                <Button type="button" variant="ghost" size="icon-sm" className="size-6 hover:text-destructive" onClick={() => set({ rows: rows.filter((_, i) => i !== r) })} aria-label={t.common.remove}><Trash2 className="size-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Field>
      <SwitchRow label={t.inspector.striped} checked={block.props.striped} onChange={(v) => set({ striped: v })} />
      <SwitchRow label={t.inspector.highlightLast} checked={!!block.props.highlightLastRow} onChange={(v) => set({ highlightLastRow: v })} />
      <Field label={t.inspector.caption}>
        <Input value={block.props.caption ?? ""} onChange={(e) => set({ caption: e.target.value })} />
      </Field>
    </>
  );
}

function InfoCardEditor({ block }: { block: Block<"infoCard"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <Field label={t.inspector.title}>
        <Input value={block.props.title} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <Field label={t.inspector.text}>
        <Textarea rows={4} value={block.props.body} onChange={(e) => set({ body: e.target.value })} />
      </Field>
      <Field label={t.inspector.tone}>
        <Segmented value={block.props.tone} onChange={(v) => set({ tone: v })} options={[{ value: "plain", label: t.inspector.tonePlain }, { value: "accent", label: t.inspector.toneAccent }, { value: "dark", label: t.inspector.toneDark }]} />
      </Field>
      <Field label={t.inspector.icon}>
        <div className="grid grid-cols-6 gap-1.5">
          {Object.entries(CARD_ICONS).map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              onClick={() => set({ icon: name })}
              className={cn("flex aspect-square items-center justify-center rounded-lg border transition-colors hover:border-copper/50", block.props.icon === name ? "border-copper bg-copper-soft text-copper" : "text-muted-foreground")}
              aria-label={name}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </Field>
    </>
  );
}

function DividerEditor({ block }: { block: Block<"divider"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <Field label={t.inspector.dividerStyle}>
        <Segmented value={block.props.variant} onChange={(v) => set({ variant: v })} options={[{ value: "line", label: t.inspector.line }, { value: "ornament", label: t.inspector.ornament }, { value: "space", label: t.inspector.space }]} />
      </Field>
      {block.props.variant !== "ornament" ? <SliderField label={t.inspector.size} value={block.props.size} min={1} max={8} unit="" onChange={(v) => set({ size: v })} /> : null}
    </>
  );
}

function QuoteEditor({ block }: { block: Block<"quote"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <Field label={t.inspector.text}>
        <Textarea rows={4} value={block.props.text} onChange={(e) => set({ text: e.target.value })} />
      </Field>
      <Field label={t.inspector.author}>
        <Input value={block.props.author ?? ""} onChange={(e) => set({ author: e.target.value })} />
      </Field>
      <Field label={t.inspector.role}>
        <Input value={block.props.role ?? ""} onChange={(e) => set({ role: e.target.value })} />
      </Field>
    </>
  );
}

function StatEditor({ block }: { block: Block<"stat"> }) {
  const t = useT();
  const set = useProps(block);
  const { items } = block.props;
  const setItem = (i: number, patch: Partial<(typeof items)[number]>) => set({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  return (
    <>
      <Field label={t.inspector.columns}>
        <Segmented value={String(block.props.columns) as "2" | "3" | "4"} onChange={(v) => set({ columns: Number(v) as 2 | 3 | 4 })} options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]} />
      </Field>
      <Field
        label={t.inspector.stats}
        action={
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => set({ items: [...items, { value: "0", label: t.inspector.label }] })}>
            <Plus className="size-3" />
            {t.inspector.addStat}
          </Button>
        }
      >
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="space-y-1.5 rounded-lg border bg-muted/30 p-2">
              <div className="flex gap-1.5">
                <Input value={it.value} className="h-8 w-24 bg-card font-semibold" onChange={(e) => setItem(i, { value: e.target.value })} aria-label={t.inspector.value} />
                <Input value={it.label} className="h-8 bg-card" onChange={(e) => setItem(i, { label: e.target.value })} aria-label={t.inspector.label} />
                <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 hover:text-destructive" onClick={() => set({ items: items.filter((_, j) => j !== i) })} aria-label={t.common.remove}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <Input value={it.note ?? ""} placeholder={t.inspector.note} className="h-8 bg-card text-xs" onChange={(e) => setItem(i, { note: e.target.value })} />
            </div>
          ))}
        </div>
      </Field>
    </>
  );
}

function FormEditor({ block }: { block: Block<"form"> }) {
  const t = useT();
  const set = useProps(block);
  const { fields } = block.props;
  const setField = (id: string, patch: Partial<FormField>) => set({ fields: fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  const types: FormField["type"][] = ["text", "email", "tel", "number", "date", "textarea", "select"];
  return (
    <>
      <Field label={t.inspector.title}>
        <Input value={block.props.title} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <Field label={t.inspector.description}>
        <Textarea rows={2} value={block.props.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <Field
        label={t.inspector.fields}
        action={
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => set({ fields: [...fields, { id: uid("f"), label: t.inspector.label, type: "text", required: false }] })}>
            <Plus className="size-3" />
            {t.inspector.addField}
          </Button>
        }
      >
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="space-y-1.5 rounded-lg border bg-muted/30 p-2">
              <div className="flex gap-1.5">
                <Input value={f.label} className="h-8 bg-card" onChange={(e) => setField(f.id, { label: e.target.value })} aria-label={t.inspector.label} />
                <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" disabled={i === 0} onClick={() => { const n = [...fields]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set({ fields: n }); }} aria-label="up"><ArrowUp className="size-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 hover:text-destructive" onClick={() => set({ fields: fields.filter((x) => x.id !== f.id) })} aria-label={t.common.remove}><Trash2 className="size-3.5" /></Button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={f.type} onValueChange={(v) => setField(f.id, { type: v as FormField["type"] })}>
                  <SelectTrigger className="h-8 bg-card text-xs" aria-label={t.inspector.fieldType}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((ty) => (
                      <SelectItem key={ty} value={ty}>
                        {t.inspector.fieldTypes[ty]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Switch checked={f.required} onCheckedChange={(v) => setField(f.id, { required: v })} />
                  {t.inspector.required}
                </label>
              </div>
              {f.type === "select" ? (
                <Input className="h-8 bg-card text-xs" placeholder={t.inspector.options} value={(f.options ?? []).join("، ")} onChange={(e) => setField(f.id, { options: e.target.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean) })} />
              ) : (
                <Input className="h-8 bg-card text-xs" placeholder="placeholder" value={f.placeholder ?? ""} onChange={(e) => setField(f.id, { placeholder: e.target.value })} />
              )}
            </div>
          ))}
        </div>
      </Field>
      <Field label={t.inspector.submitLabel}>
        <Input value={block.props.submitLabel} onChange={(e) => set({ submitLabel: e.target.value })} />
      </Field>
      <Field label={t.inspector.successMessage}>
        <Input value={block.props.successMessage} onChange={(e) => set({ successMessage: e.target.value })} />
      </Field>
    </>
  );
}

function SignatureEditor({ block }: { block: Block<"signature"> }) {
  const t = useT();
  const set = useProps(block);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Field label={t.inspector.label}>
        <Input value={block.props.label} onChange={(e) => set({ label: e.target.value })} />
      </Field>
      <Field label={t.inspector.signer}>
        <Input value={block.props.signerName} onChange={(e) => set({ signerName: e.target.value })} />
      </Field>
      <Field label={t.inspector.signerRole}>
        <Input value={block.props.signerRole ?? ""} onChange={(e) => set({ signerRole: e.target.value })} />
      </Field>
      <Field label={t.inspector.date}>
        <Input type="date" dir="ltr" value={block.props.date ?? ""} onChange={(e) => set({ date: e.target.value })} />
      </Field>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(true)}>
          <PenLine />
          {t.inspector.drawSignature}
        </Button>
        {block.props.image ? (
          <Button type="button" variant="ghost" onClick={() => set({ image: undefined })}>
            {t.inspector.clearSignature}
          </Button>
        ) : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.inspector.drawSignature}</DialogTitle>
            <DialogDescription>{block.props.signerName}</DialogDescription>
          </DialogHeader>
          <SignaturePad
            labels={{ clear: t.inspector.clearSignature, save: t.inspector.saveSignature, hint: t.blockUi.signHere }}
            onSave={(url) => {
              set({ image: url });
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function MapEditor({ block }: { block: Block<"map"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <Field label={t.inspector.address}>
        <Input value={block.props.query} onChange={(e) => set({ query: e.target.value })} />
      </Field>
      <Field label={t.inspector.label}>
        <Input value={block.props.label ?? ""} onChange={(e) => set({ label: e.target.value })} />
      </Field>
      <SliderField label={t.inspector.zoom} value={block.props.zoom} min={3} max={20} unit="" onChange={(v) => set({ zoom: v })} />
      <SliderField label={t.inspector.height} value={block.props.height} min={180} max={600} step={10} onChange={(v) => set({ height: v })} />
    </>
  );
}

function FileEditor({ block }: { block: Block<"file"> }) {
  const t = useT();
  const set = useProps(block);
  return (
    <>
      <UploadButton
        accept="*/*"
        label={t.inspector.fileUpload}
        onFile={async (f) => {
          if (f.size > MAX_FILE) return toast.error(t.inspector.fileTooLarge);
          set({ dataUrl: await readAsDataUrl(f), name: f.name, size: f.size, mime: f.type, url: undefined });
        }}
      />
      {block.props.dataUrl ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs">
          <span className="truncate">{block.props.name} · {formatBytes(block.props.size)}</span>
          <button type="button" onClick={() => set({ dataUrl: undefined, size: undefined, mime: undefined })} className="text-muted-foreground hover:text-destructive" aria-label={t.common.remove}>
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <Field label={t.inspector.url}>
          <Input dir="ltr" placeholder="https://…" value={block.props.url ?? ""} onChange={(e) => set({ url: e.target.value })} />
        </Field>
      )}
      <Field label={t.inspector.fileName}>
        <Input value={block.props.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <Field label={t.inspector.description}>
        <Input value={block.props.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
      </Field>
    </>
  );
}

export function ContentEditor({ block }: { block: AnyBlock }) {
  const t = useT();
  const body = (() => {
    switch (block.type) {
      case "heading": return <HeadingEditor block={block} />;
      case "text": return <TextEditor block={block} />;
      case "image": return <ImageEditor block={block} />;
      case "video": return <VideoEditor block={block} />;
      case "button": return <ButtonEditor block={block} />;
      case "link": return <LinkEditor block={block} />;
      case "table": return <TableEditor block={block} />;
      case "infoCard": return <InfoCardEditor block={block} />;
      case "divider": return <DividerEditor block={block} />;
      case "quote": return <QuoteEditor block={block} />;
      case "stat": return <StatEditor block={block} />;
      case "form": return <FormEditor block={block} />;
      case "signature": return <SignatureEditor block={block} />;
      case "map": return <MapEditor block={block} />;
      case "file": return <FileEditor block={block} />;
    }
  })();
  return <Section title={t.inspector.content}>{body}</Section>;
}
