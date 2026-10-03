"use client";

import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Copy, Trash2 } from "lucide-react";
import type { AnyBlock, BlockStyle } from "@/lib/types";
import { useEditor } from "@/lib/stores/editor-store";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { BASE_STYLE, BLOCK_ICONS, DEFAULT_FONT_SIZE, HEADING_SIZES } from "@/lib/blocks/registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorField, Field, Section, Segmented, SliderField } from "./controls";
import { ContentEditor } from "./content-editors";
import { DocumentSettings } from "./document-settings";

const TYPOGRAPHY_BLOCKS = new Set<AnyBlock["type"]>(["heading", "text", "quote", "button", "link", "table", "infoCard", "stat"]);

function defaultFontSize(block: AnyBlock, base: number) {
  if (block.type === "heading") return HEADING_SIZES[block.props.level];
  if (block.type === "stat") return 40;
  if (block.type === "table" || block.type === "infoCard") return 15;
  return DEFAULT_FONT_SIZE[block.type] ?? base;
}

function DesignPanel({ block }: { block: AnyBlock }) {
  const t = useT();
  const { dir } = useLocale();
  const doc = useEditor((s) => s.doc)!;
  const updateStyle = useEditor((s) => s.updateStyle);
  const set = (patch: Partial<BlockStyle>) => updateStyle(block.id, patch);
  const s = block.style;
  const StartIcon = dir === "rtl" ? AlignRight : AlignLeft;
  const EndIcon = dir === "rtl" ? AlignLeft : AlignRight;

  return (
    <>
      {TYPOGRAPHY_BLOCKS.has(block.type) ? (
        <Section title={t.inspector.typography}>
          <Field label={t.inspector.font}>
            <Segmented
              value={s.fontFamily ?? "default"}
              onChange={(v) => set({ fontFamily: v === "default" ? undefined : (v as "sans" | "serif") })}
              options={[
                { value: "default", label: t.inspector.fontDefault },
                { value: "sans", label: <span className="font-sans">{t.inspector.fontSans}</span> },
                { value: "serif", label: <span className="font-display text-[15px]">{t.inspector.fontSerif}</span> },
              ]}
            />
          </Field>
          <SliderField
            label={t.inspector.size}
            value={s.fontSize ?? defaultFontSize(block, doc.theme.baseFontSize)}
            min={10}
            max={80}
            onChange={(v) => set({ fontSize: v })}
            onReset={s.fontSize ? () => set({ fontSize: undefined }) : undefined}
            resetLabel={t.inspector.reset}
          />
          <Field label={t.inspector.weight}>
            <Select value={String(s.fontWeight ?? "default")} onValueChange={(v) => set({ fontWeight: v === "default" ? undefined : (Number(v) as BlockStyle["fontWeight"]) })}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t.inspector.fontDefault}</SelectItem>
                {[300, 400, 500, 600, 700].map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    <span style={{ fontWeight: w }}>{w}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <ColorField label={t.inspector.color} value={s.color} onChange={(v) => set({ color: v })} emptyLabel={t.inspector.reset} />
        </Section>
      ) : null}

      <Section title={t.inspector.layout}>
        <Field label={t.inspector.align}>
          <Segmented
            value={s.align}
            onChange={(v) => set({ align: v })}
            options={[
              { value: "start", label: <StartIcon />, title: "start" },
              { value: "center", label: <AlignCenter />, title: "center" },
              { value: "end", label: <EndIcon />, title: "end" },
              { value: "justify", label: <AlignJustify />, title: "justify" },
            ]}
          />
        </Field>
        <SliderField label={t.inspector.paddingY} value={s.paddingY} min={0} max={96} step={2} onChange={(v) => set({ paddingY: v })} />
        <SliderField label={t.inspector.paddingX} value={s.paddingX} min={0} max={96} step={2} onChange={(v) => set({ paddingX: v })} />
        <SliderField label={t.inspector.marginY} value={s.marginY} min={0} max={96} step={2} onChange={(v) => set({ marginY: v })} />
      </Section>

      <Section title={t.inspector.appearance}>
        <ColorField label={t.inspector.background} value={s.background} onChange={(v) => set({ background: v })} emptyLabel={t.inspector.none} />
        <SliderField label={t.inspector.borderWidth} value={s.borderWidth} min={0} max={8} onChange={(v) => set({ borderWidth: v })} />
        {s.borderWidth > 0 ? <ColorField label={t.inspector.borderColor} value={s.borderColor} allowEmpty={false} onChange={(v) => set({ borderColor: v ?? BASE_STYLE.borderColor })} /> : null}
        <SliderField label={t.inspector.radius} value={s.borderRadius} min={0} max={40} onChange={(v) => set({ borderRadius: v })} />
        <Field label={t.inspector.shadow}>
          <Segmented
            value={s.shadow}
            onChange={(v) => set({ shadow: v })}
            options={[
              { value: "none", label: t.inspector.shadowNone },
              { value: "sm", label: "S" },
              { value: "md", label: "M" },
              { value: "lg", label: "L" },
            ]}
          />
        </Field>
      </Section>
    </>
  );
}

function BehaviorPanel({ block }: { block: AnyBlock }) {
  const t = useT();
  const updateBlock = useEditor((s) => s.updateBlock);
  return (
    <Section title={t.inspector.behavior}>
      <label className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-[13px] font-medium">{t.inspector.hideMobile}</span>
          <span className="block text-[11px] text-muted-foreground">{t.inspector.hideMobileHint}</span>
        </span>
        <Switch checked={block.hideOnMobile} onCheckedChange={(v) => updateBlock(block.id, { hideOnMobile: v })} />
      </label>
      <Field label={t.inspector.clickLink} hint={t.inspector.clickLinkHint}>
        <Input dir="ltr" placeholder="https://…" value={block.href ?? ""} onChange={(e) => updateBlock(block.id, { href: e.target.value || undefined })} />
      </Field>
      <Field label={t.inspector.animation}>
        <Segmented
          value={block.animation}
          onChange={(v) => updateBlock(block.id, { animation: v })}
          options={[
            { value: "none", label: t.inspector.animNone },
            { value: "fade", label: t.inspector.animFade },
            { value: "slide-up", label: t.inspector.animSlide },
            { value: "zoom", label: t.inspector.animZoom },
          ]}
        />
      </Field>
    </Section>
  );
}

export function Inspector() {
  const t = useT();
  const block = useEditor((s) => s.doc?.blocks.find((b) => b.id === s.selectedId) ?? null);
  const { duplicateBlock, removeBlock } = useEditor.getState();

  if (!block) return <DocumentSettings />;
  const Icon = BLOCK_ICONS[block.type];

  return (
    <div key={block.id}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-copper-soft text-copper">
            <Icon className="size-4" />
          </span>
          <div className="text-sm font-semibold">{t.blocks[block.type]}</div>
        </div>
        <div className="flex">
          <Button variant="ghost" size="icon-sm" onClick={() => duplicateBlock(block.id)} aria-label={t.editor.duplicateBlock} title={t.editor.duplicateBlock}>
            <Copy />
          </Button>
          <Button variant="ghost" size="icon-sm" className="hover:text-destructive" onClick={() => removeBlock(block.id)} aria-label={t.editor.deleteBlock} title={t.editor.deleteBlock}>
            <Trash2 />
          </Button>
        </div>
      </div>
      <Tabs defaultValue="content">
        <div className="px-4 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="content">{t.inspector.content}</TabsTrigger>
            <TabsTrigger value="design">{t.inspector.appearance}</TabsTrigger>
            <TabsTrigger value="behavior">{t.inspector.behavior}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="content">
          <ContentEditor block={block} />
        </TabsContent>
        <TabsContent value="design">
          <DesignPanel block={block} />
        </TabsContent>
        <TabsContent value="behavior">
          <BehaviorPanel block={block} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
