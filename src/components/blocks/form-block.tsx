"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, Lock } from "lucide-react";
import type { Block, FormField } from "@/lib/types";
import { cn } from "@/lib/utils";
import { dictionaries } from "@/lib/i18n/dictionary";
import { useRenderContext } from "./context";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FormBlock({ block }: { block: Block<"form"> }) {
  const ctx = useRenderContext();
  const t = dictionaries[ctx.locale].blockUi;
  const { title, description, fields, submitLabel, successMessage } = block.props;
  const interactive = ctx.mode === "view" && ctx.canFill;
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.id] ?? "").trim();
      if (f.required && !v) next[f.id] = t.required;
      else if (v && f.type === "email" && !EMAIL_RE.test(v)) next[f.id] = t.invalidEmail;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactive || !validate()) return;
    setBusy(true);
    try {
      const labelled = Object.fromEntries(fields.map((f) => [f.label, values[f.id] ?? ""]));
      await ctx.onSubmitForm?.(block, labelled);
      setDone(true);
      setValues({});
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--doc-bg)",
    borderColor: "var(--doc-border)",
    color: "var(--doc-text)",
  };

  const renderField = (f: FormField) => {
    const common = {
      id: `${block.id}-${f.id}`,
      name: f.id,
      value: values[f.id] ?? "",
      disabled: !interactive,
      placeholder: f.placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValues((s) => ({ ...s, [f.id]: e.target.value }));
        if (errors[f.id]) setErrors((s) => ({ ...s, [f.id]: "" }));
      },
      className: cn(
        "w-full rounded-xl border px-3.5 text-[15px] outline-none transition-[border-color,box-shadow] placeholder:opacity-50 focus:border-[var(--doc-accent)] focus:ring-4 focus:ring-[var(--doc-ring)] disabled:cursor-default",
        errors[f.id] && "border-[#B4372F]!"
      ),
      style: inputStyle,
      "aria-invalid": !!errors[f.id],
    };
    if (f.type === "textarea") return <textarea {...common} rows={4} className={cn(common.className, "py-3 leading-relaxed")} />;
    if (f.type === "select")
      return (
        <select {...common} className={cn(common.className, "h-12")}>
          <option value="">{t.select}</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    return <input {...common} type={f.type} className={cn(common.className, "h-12")} dir={f.type === "email" || f.type === "tel" ? "ltr" : undefined} />;
  };

  return (
    <div className="border p-6 @md/doc:p-8" style={{ borderRadius: block.style.borderRadius, borderColor: "var(--doc-border)", background: block.style.background || "var(--doc-surface)", textAlign: "start" }}>
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-8 text-center">
            <CircleCheck className="size-12" style={{ color: "var(--doc-accent)" }} />
            <div className="text-lg font-semibold">{successMessage}</div>
            <button type="button" onClick={() => setDone(false)} className="text-sm underline-offset-4 hover:underline" style={{ color: "var(--doc-muted)" }}>
              {t.sendAnother}
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" initial={false} exit={{ opacity: 0 }} onSubmit={submit} noValidate className="space-y-5">
            <div>
              <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", fontSize: 24 }}>
                {title}
              </div>
              {description ? (
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--doc-muted)" }}>
                  {description}
                </p>
              ) : null}
            </div>
            <div className="grid gap-4 @lg/doc:grid-cols-2">
              {fields.map((f) => (
                <div key={f.id} className={cn("space-y-1.5", (f.type === "textarea" || fields.length === 1) && "@lg/doc:col-span-2")}>
                  <label htmlFor={`${block.id}-${f.id}`} className="block text-sm font-medium">
                    {f.label}
                    {f.required ? <span style={{ color: "var(--doc-accent)" }}> *</span> : null}
                  </label>
                  {renderField(f)}
                  {errors[f.id] ? <div className="text-xs text-[#B4372F]">{errors[f.id]}</div> : null}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!interactive || busy}
                className="inline-flex h-12 items-center justify-center rounded-full px-8 font-medium text-white transition-opacity disabled:cursor-default"
                style={{ background: "var(--doc-accent)", opacity: ctx.mode === "view" && !interactive ? 0.5 : 1 }}
              >
                {submitLabel}
              </button>
              {ctx.mode === "view" && !ctx.canFill ? (
                <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--doc-muted)" }}>
                  <Lock className="size-3.5" />
                  {t.formDisabled}
                </span>
              ) : null}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
