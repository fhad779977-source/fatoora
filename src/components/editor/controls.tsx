"use client";

import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Hint } from "@/components/ui/tooltip";

export function Field({ label, children, className, hint, action }: { label: ReactNode; children: ReactNode; className?: string; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label>{label}</Label>
        {action}
      </div>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4 border-b px-4 py-5 last:border-b-0", className)}>
      <h4 className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{title}</h4>
      {children}
    </section>
  );
}

export function ResetButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Hint label={label}>
      <button type="button" onClick={onClick} className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={label}>
        <RotateCcw className="size-3" />
      </button>
    </Hint>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
  onReset,
  resetLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  onReset?: () => void;
  resetLabel?: string;
}) {
  return (
    <Field
      label={label}
      action={
        <span className="flex items-center gap-1.5">
          {onReset ? <ResetButton onClick={onReset} label={resetLabel ?? ""} /> : null}
          <span className="min-w-10 rounded bg-muted px-1.5 py-0.5 text-center text-[11px] tabular-nums text-muted-foreground" dir="ltr">
            {value}
            {unit}
          </span>
        </span>
      }
    >
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </Field>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as T)} className={className}>
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} aria-label={o.title ?? String(o.value)} title={o.title}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const SWATCHES = ["#0B1220", "#F5F1E8", "#B9824A", "#FFFFFF", "#8993A4", "#1F2B43", "#EFE4D4", "#6B7484"];

export function ColorField({
  label,
  value,
  onChange,
  allowEmpty = true,
  emptyLabel,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <Field label={label} action={allowEmpty && value ? <ResetButton onClick={() => onChange(undefined)} label={emptyLabel ?? ""} /> : null}>
      <div className="flex items-center gap-2">
        <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border shadow-xs" style={{ background: value || "transparent" }}>
          {!value ? <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,#B4372F_45%,#B4372F_55%,transparent_55%)] opacity-60" /> : null}
          <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={label} />
        </label>
        <div className="flex flex-wrap gap-1">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn("size-5 rounded-md border transition-transform hover:scale-110", value?.toUpperCase() === c && "ring-2 ring-copper ring-offset-1 ring-offset-background")}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
    </Field>
  );
}
