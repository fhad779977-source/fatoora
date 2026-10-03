"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import type { DocumentTheme, FormSubmission, ThemePreset } from "@/lib/types";
import { useEditor } from "@/lib/stores/editor-store";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { THEME_PRESETS } from "@/lib/document";
import { getRepository } from "@/lib/storage/idb-repository";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ColorField, Field, Section, Segmented, SliderField } from "./controls";

export function DocumentSettings() {
  const t = useT();
  const { locale } = useLocale();
  const doc = useEditor((s) => s.doc)!;
  const updateDoc = useEditor((s) => s.updateDoc);
  const setTheme = (patch: Partial<DocumentTheme>) => updateDoc({ theme: { ...doc.theme, ...patch } }, `theme:${Object.keys(patch).join(",")}`);
  const [submissions, setSubmissions] = useState<FormSubmission[] | null>(null);

  useEffect(() => {
    getRepository().listSubmissions(doc.id).then(setSubmissions);
  }, [doc.id]);

  const presets: { id: ThemePreset; label: string }[] = [
    { id: "ivory", label: t.inspector.themeIvory },
    { id: "white", label: t.inspector.themeWhite },
    { id: "navy", label: t.inspector.themeNavy },
  ];

  return (
    <div>
      <div className="border-b px-4 py-3">
        <div className="text-sm font-semibold">{t.inspector.docSettings}</div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.editor.selectBlock}</p>
      </div>
      <Section title={t.inspector.docTheme}>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((p) => {
            const preset = THEME_PRESETS[p.id];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setTheme({ ...preset })}
                className={cn("overflow-hidden rounded-xl border text-xs font-medium transition-all", doc.theme.preset === p.id ? "border-copper ring-2 ring-copper/25" : "hover:border-copper/40")}
              >
                <div className="flex h-14 flex-col justify-center gap-1 px-2.5" style={{ background: preset.background }}>
                  <div className="h-1.5 w-8 rounded-full" style={{ background: preset.textColor }} />
                  <div className="h-1 w-12 rounded-full opacity-40" style={{ background: preset.textColor }} />
                  <div className="h-1.5 w-5 rounded-full" style={{ background: preset.accentColor }} />
                </div>
                <div className="border-t bg-card py-1.5">{p.label}</div>
              </button>
            );
          })}
        </div>
        <ColorField label={t.inspector.docBackground} value={doc.theme.background} allowEmpty={false} onChange={(v) => v && setTheme({ background: v })} />
        <ColorField label={t.inspector.docText} value={doc.theme.textColor} allowEmpty={false} onChange={(v) => v && setTheme({ textColor: v })} />
        <ColorField label={t.inspector.docAccent} value={doc.theme.accentColor} allowEmpty={false} onChange={(v) => v && setTheme({ accentColor: v })} />
      </Section>
      <Section title={t.inspector.typography}>
        <Field label={t.inspector.docFont}>
          <Segmented value={doc.theme.fontFamily} onChange={(v) => setTheme({ fontFamily: v })} options={[{ value: "sans", label: t.inspector.fontSans }, { value: "serif", label: t.inspector.fontSerif }]} />
        </Field>
        <Field label={t.inspector.docHeadingFont}>
          <Segmented value={doc.theme.headingFont} onChange={(v) => setTheme({ headingFont: v })} options={[{ value: "sans", label: t.inspector.fontSans }, { value: "serif", label: t.inspector.fontSerif }]} />
        </Field>
        <SliderField label={t.inspector.docFontSize} value={doc.theme.baseFontSize} min={13} max={22} onChange={(v) => setTheme({ baseFontSize: v })} />
      </Section>
      <Section title={t.inspector.layout}>
        <Field label={t.inspector.docWidth}>
          <Segmented value={doc.theme.width} onChange={(v) => setTheme({ width: v })} options={[{ value: "narrow", label: t.inspector.widthNarrow }, { value: "normal", label: t.inspector.widthNormal }, { value: "wide", label: t.inspector.widthWide }]} />
        </Field>
        <Field label={t.inspector.docLanguage}>
          <Segmented value={doc.language} onChange={(v) => updateDoc({ language: v })} options={[{ value: "ar", label: "العربية · RTL" }, { value: "en", label: "English · LTR" }]} />
        </Field>
        <Field label={t.inspector.docStatus}>
          <Segmented
            value={doc.status}
            onChange={(v) => updateDoc({ status: v })}
            options={[
              { value: "draft", label: t.dashboard.status.draft },
              { value: "published", label: t.dashboard.status.published },
              { value: "archived", label: t.dashboard.status.archived },
            ]}
          />
        </Field>
      </Section>
      <Section title={t.inspector.submissions}>
        {!submissions || submissions.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Inbox className="size-4" />
            {t.inspector.noSubmissions}
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.slice(0, 20).map((s) => (
              <div key={s.id} className="rounded-lg border bg-card p-2.5 text-xs">
                <div className="mb-1.5 text-[10px] text-muted-foreground">{relativeTime(s.submittedAt, locale)}</div>
                {Object.entries(s.values).map(([k, v]) => (
                  <div key={k} className="flex gap-1.5">
                    <span className="shrink-0 text-muted-foreground">{k}:</span>
                    <span className="break-words">{v.startsWith("data:image") ? "✍︎" : v || "—"}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
