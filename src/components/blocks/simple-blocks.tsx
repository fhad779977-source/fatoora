"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { ArrowUpLeft, ArrowUpRight, Download, ExternalLink, FileText, ImageIcon, MapPin, Paperclip, Play, Quote as QuoteIcon, Video as VideoIcon } from "lucide-react";
import type { Block } from "@/lib/types";
import { cn } from "@/lib/utils";
import { dictionaries } from "@/lib/i18n/dictionary";
import { DEFAULT_FONT_SIZE, HEADING_SIZES } from "@/lib/blocks/registry";
import { useRenderContext } from "./context";
import { EditableText } from "./editable-text";
import { CardIcon } from "./icons";
import { formatBytes, hostOf, isSafeUrl, mapEmbedUrl, mapLinkUrl, parseVideoUrl } from "./media";

const fontVar = (f: "sans" | "serif") => (f === "serif" ? "var(--font-serif)" : "var(--font-sans)");

/** Responsive size: full size on wide pages, scales down inside narrow (mobile) containers. */
const fluid = (px: number) => `min(${px}px, calc(${(px * 0.62).toFixed(1)}px + ${(px * 0.055).toFixed(2)}cqi))`;

function useInline<T extends Block["type"]>(block: Block<T>) {
  const { mode, onInlineEdit } = useRenderContext();
  return mode === "edit" && onInlineEdit ? (patch: Partial<Block<T>["props"]>) => onInlineEdit<T>(block.id, patch) : undefined;
}

export function HeadingBlock({ block }: { block: Block<"heading"> }) {
  const { theme } = useRenderContext();
  const edit = useInline(block);
  const { level, text, eyebrow } = block.props;
  const size = block.style.fontSize ?? HEADING_SIZES[level];
  const Tag = (`h${level}` as "h1" | "h2" | "h3");
  return (
    <div>
      {eyebrow ? (
        <div className="mb-3 text-[13px] font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--doc-accent)" }}>
          {eyebrow}
        </div>
      ) : null}
      <EditableText
        as={Tag}
        value={text}
        onChange={edit ? (v) => edit({ text: v }) : undefined}
        multiline={false}
        className="text-balance"
        style={{
          fontSize: fluid(size),
          lineHeight: level === 1 ? 1.2 : 1.3,
          fontWeight: block.style.fontWeight ?? (level === 1 ? 700 : 600),
          fontFamily: block.style.fontFamily ? fontVar(block.style.fontFamily) : fontVar(theme.headingFont),
        }}
      />
    </div>
  );
}

export function TextBlock({ block }: { block: Block<"text"> }) {
  const { theme } = useRenderContext();
  const edit = useInline(block);
  return (
    <EditableText
      value={block.props.text}
      onChange={edit ? (v) => edit({ text: v }) : undefined}
      className="text-pretty"
      style={{
        fontSize: block.style.fontSize ?? theme.baseFontSize ?? DEFAULT_FONT_SIZE.text,
        lineHeight: 1.95,
        color: block.style.color || "color-mix(in srgb, var(--doc-text) 86%, transparent)",
      }}
    />
  );
}

export function ImageBlock({ block, onOpen }: { block: Block<"image">; onOpen?: (src: string, alt: string) => void }) {
  const { mode } = useRenderContext();
  const t = dictionaries[useRenderContext().locale].blockUi;
  const { src, alt, caption, fit, height } = block.props;
  const radius = block.style.borderRadius;
  const Frame = mode === "view" ? "button" : "div";
  if (!src) {
    if (mode !== "edit") return null;
    return (
      <div className="flex flex-col items-center justify-center gap-2 border border-dashed text-sm" style={{ height: Math.min(height, 240), borderRadius: radius, borderColor: "var(--doc-border)", color: "var(--doc-muted)" }}>
        <ImageIcon className="size-7 opacity-60" />
        {t.imageEmpty}
      </div>
    );
  }
  return (
    <figure className="m-0">
      <Frame
        {...(mode === "view" ? { type: "button" as const, onClick: () => onOpen?.(src, alt), "aria-label": t.enlarge } : {})}
        className={cn("group block w-full overflow-hidden", mode === "view" && "cursor-zoom-in")}
        style={{ borderRadius: radius, background: "var(--doc-surface)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn("block w-full transition-transform duration-700", mode === "view" && "group-hover:scale-[1.015]")}
          style={{ height: fit === "cover" ? height : "auto", maxHeight: fit === "contain" ? height : undefined, objectFit: fit }}
        />
      </Frame>
      {caption ? (
        <figcaption className="mt-3 text-[13px]" style={{ color: "var(--doc-muted)", textAlign: "center" }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function VideoBlock({ block }: { block: Block<"video"> }) {
  const { mode, locale } = useRenderContext();
  const t = dictionaries[locale].blockUi;
  const source = parseVideoUrl(block.props.url);
  const radius = block.style.borderRadius;

  if (mode === "export" || source.kind === "unknown") {
    if (mode === "view" && source.kind === "unknown") return null;
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden px-6 text-center" style={{ borderRadius: radius, background: "#0B1220", color: "#F5F1E8" }}>
        <div className="flex size-16 items-center justify-center rounded-full border border-white/20 bg-white/5">
          {source.kind === "unknown" ? <VideoIcon className="size-7 text-[#B9824A]" /> : <Play className="size-7 translate-x-0.5 fill-[#B9824A] text-[#B9824A]" />}
        </div>
        <div className="font-medium">{block.props.title || t.watchVideo}</div>
        <div className="text-xs opacity-60">{source.kind === "unknown" ? t.videoEmpty : t.exportVideo}</div>
        {source.kind !== "unknown" ? <div className="text-[11px] opacity-40" dir="ltr">{block.props.url}</div> : null}
      </div>
    );
  }

  return (
    <figure className="m-0">
      <div className="relative aspect-video w-full overflow-hidden bg-black" style={{ borderRadius: radius }}>
        {source.kind === "file" ? (
          <video src={source.src} controls playsInline className="size-full object-contain" />
        ) : (
          <iframe
            src={source.embed}
            title={block.props.title || "video"}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        )}
        {mode === "edit" ? <div className="absolute inset-0" /> : null}
      </div>
      {block.props.caption ? (
        <figcaption className="mt-3 text-center text-[13px]" style={{ color: "var(--doc-muted)" }}>
          {block.props.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function ButtonBlock({ block }: { block: Block<"button"> }) {
  const { mode } = useRenderContext();
  const { label, url, variant, newTab } = block.props;
  const justify = { start: "flex-start", center: "center", end: "flex-end", justify: "stretch" }[block.style.align];
  const solid = variant === "solid";
  const A = mode === "export" ? "span" : "a";
  return (
    <div className="flex" style={{ justifyContent: justify }}>
      <A
        href={isSafeUrl(url) ? url : undefined}
        target={newTab ? "_blank" : undefined}
        rel="noopener noreferrer"
        onClick={(e) => mode !== "view" && e.preventDefault()}
        className={cn(
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 font-medium transition-all duration-300",
          mode === "view" && "hover:-translate-y-0.5 hover:shadow-lg",
          block.style.align === "justify" && "w-full"
        )}
        style={{
          fontSize: block.style.fontSize ?? DEFAULT_FONT_SIZE.button,
          background: solid ? "var(--doc-accent)" : "transparent",
          color: solid ? "#FFFFFF" : "var(--doc-text)",
          border: solid ? "1px solid var(--doc-accent)" : "1px solid color-mix(in srgb, var(--doc-text) 30%, transparent)",
        }}
      >
        {label}
        <ArrowUpLeft className="size-4 ltr:hidden" />
        <ArrowUpRight className="size-4 rtl:hidden" />
      </A>
    </div>
  );
}

export function LinkBlock({ block }: { block: Block<"link"> }) {
  const { mode } = useRenderContext();
  const { label, url, description } = block.props;
  const A = mode === "export" ? "div" : "a";
  return (
    <A
      href={isSafeUrl(url) ? url : undefined}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => mode !== "view" && e.preventDefault()}
      className={cn("group flex items-center gap-4 rounded-2xl border p-4 transition-colors", mode === "view" && "hover:border-[var(--doc-accent)]")}
      style={{ borderColor: "var(--doc-border)", background: "var(--doc-surface)", textAlign: "start" }}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--doc-accent-soft)", color: "var(--doc-accent)" }}>
        <ExternalLink className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold" style={{ fontSize: block.style.fontSize ?? DEFAULT_FONT_SIZE.link }}>
          {label}
        </div>
        {description ? (
          <div className="mt-0.5 text-sm" style={{ color: "var(--doc-muted)" }}>
            {description}
          </div>
        ) : null}
        <div className="mt-1 truncate text-xs" style={{ color: "var(--doc-accent)" }} dir="ltr">
          {hostOf(url)}
        </div>
      </div>
    </A>
  );
}

export function TableBlock({ block }: { block: Block<"table"> }) {
  const { mode } = useRenderContext();
  const { headers, rows, striped, caption, highlightLastRow } = block.props;
  const size = block.style.fontSize ?? 15;
  return (
    <figure className="m-0">
      <div className={cn("overflow-hidden rounded-2xl border", mode !== "export" && "overflow-x-auto")} style={{ borderColor: "var(--doc-border)" }}>
        <table className="w-full border-collapse" style={{ fontSize: size, minWidth: mode === "export" ? undefined : Math.min(headers.length * 120, 560) }}>
          <thead>
            <tr style={{ background: "var(--doc-text)", color: "var(--doc-bg)" }}>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 text-start font-semibold whitespace-nowrap" style={{ fontSize: size - 1 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => {
              const last = highlightLastRow && r === rows.length - 1;
              return (
                <tr
                  key={r}
                  style={{
                    background: last ? "var(--doc-accent-soft)" : striped && r % 2 === 1 ? "var(--doc-surface)" : "transparent",
                    fontWeight: last ? 700 : undefined,
                    borderTop: "1px solid var(--doc-border)",
                  }}
                >
                  {headers.map((_, c) => (
                    <td key={c} className="px-4 py-3 align-top">
                      {row[c] ?? ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {caption ? (
        <figcaption className="mt-2.5 text-[13px]" style={{ color: "var(--doc-muted)" }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function InfoCardBlock({ block }: { block: Block<"infoCard"> }) {
  const edit = useInline(block);
  const { icon, title, body, tone } = block.props;
  const palette =
    tone === "dark"
      ? { bg: "#0B1220", fg: "#F5F1E8", muted: "#AEB5C2", iconBg: "rgba(185,130,74,.16)", border: "transparent" }
      : tone === "accent"
        ? { bg: "var(--doc-accent-soft)", fg: "var(--doc-text)", muted: "color-mix(in srgb, var(--doc-text) 72%, transparent)", iconBg: "var(--doc-accent)", border: "transparent" }
        : { bg: "var(--doc-surface)", fg: "var(--doc-text)", muted: "var(--doc-muted)", iconBg: "var(--doc-accent-soft)", border: "var(--doc-border)" };
  return (
    <div
      className="flex gap-4 p-6"
      style={{
        background: block.style.background || palette.bg,
        color: block.style.color || palette.fg,
        borderRadius: block.style.borderRadius,
        border: block.style.borderWidth ? undefined : `1px solid ${palette.border}`,
        textAlign: "start",
      }}
    >
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: palette.iconBg, color: tone === "accent" ? "#FFFFFF" : "var(--doc-accent)" }}
      >
        <CardIcon name={icon} className="size-5" />
      </div>
      <div className="min-w-0 flex-1" style={{ textAlign: block.style.align === "center" ? "center" : undefined }}>
        <EditableText as="div" value={title} onChange={edit ? (v) => edit({ title: v }) : undefined} multiline={false} className="font-semibold" style={{ fontSize: (block.style.fontSize ?? 17) + 1 }} />
        <EditableText
          as="div"
          value={body}
          onChange={edit ? (v) => edit({ body: v }) : undefined}
          className="mt-1.5 leading-[1.85]"
          style={{ color: palette.muted, fontSize: block.style.fontSize ?? 15 }}
        />
      </div>
    </div>
  );
}

export function DividerBlock({ block }: { block: Block<"divider"> }) {
  const { variant, size } = block.props;
  if (variant === "space") return <div style={{ height: Math.max(8, size * 24) }} aria-hidden />;
  if (variant === "ornament") {
    return (
      <div className="flex items-center gap-4 py-2" aria-hidden>
        <div className="h-px flex-1" style={{ background: "var(--doc-border)" }} />
        <div className="flex items-center gap-1.5">
          <span className="size-1 rotate-45" style={{ background: "var(--doc-accent)", opacity: 0.5 }} />
          <span className="size-2 rotate-45" style={{ background: "var(--doc-accent)" }} />
          <span className="size-1 rotate-45" style={{ background: "var(--doc-accent)", opacity: 0.5 }} />
        </div>
        <div className="h-px flex-1" style={{ background: "var(--doc-border)" }} />
      </div>
    );
  }
  return <div className="py-2" aria-hidden><div style={{ height: Math.max(1, size), background: block.style.color || "var(--doc-border)" }} /></div>;
}

export function QuoteBlock({ block }: { block: Block<"quote"> }) {
  const { theme } = useRenderContext();
  const edit = useInline(block);
  const { text, author, role } = block.props;
  return (
    <blockquote className="relative m-0 ps-8" style={{ borderInlineStart: "2px solid var(--doc-accent)" }}>
      <QuoteIcon className="mb-3 size-7 rtl:-scale-x-100" style={{ color: "var(--doc-accent)", opacity: 0.8 }} />
      <EditableText
        as="p"
        value={text}
        onChange={edit ? (v) => edit({ text: v }) : undefined}
        className="m-0 text-balance"
        style={{
          fontSize: fluid(block.style.fontSize ?? DEFAULT_FONT_SIZE.quote ?? 24),
          lineHeight: 1.6,
          fontFamily: block.style.fontFamily ? fontVar(block.style.fontFamily) : fontVar(theme.headingFont),
          fontWeight: block.style.fontWeight ?? 500,
        }}
      />
      {author ? (
        <footer className="mt-4 text-sm">
          <span className="font-semibold">{author}</span>
          {role ? <span style={{ color: "var(--doc-muted)" }}> — {role}</span> : null}
        </footer>
      ) : null}
    </blockquote>
  );
}

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const match = value.match(/^([^\d٠-٩]*)([\d٠-٩][\d٠-٩,.]*)(.*)$/);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || !match) return;
    const [, prefix, num, suffix] = match;
    const arabicDigits = /[٠-٩]/.test(num);
    const normalized = num.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/,/g, "");
    const target = parseFloat(normalized);
    if (!isFinite(target)) return;
    const decimals = normalized.includes(".") ? normalized.split(".")[1].length : 0;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        let s = v.toFixed(decimals);
        if (num.includes(",")) s = Number(s).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        if (arabicDigits) s = s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
        setDisplay(`${prefix}${s}${suffix}`);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return <span ref={ref}>{display}</span>;
}

export function StatBlock({ block }: { block: Block<"stat"> }) {
  const { mode, theme } = useRenderContext();
  const { items, columns } = block.props;
  const cols = { 2: "@md/doc:grid-cols-2", 3: "@md/doc:grid-cols-3", 4: "@md/doc:grid-cols-2 @2xl/doc:grid-cols-4" }[columns];
  return (
    <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-2xl border", cols)} style={{ borderColor: "var(--doc-border)", background: "var(--doc-border)" }}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col gap-1.5 p-5 @md/doc:p-6",
            // An odd last item fills the row instead of leaving an empty cell.
            i === items.length - 1 && items.length % 2 === 1 && "col-span-2",
            i === items.length - 1 && items.length % 2 === 1 && columns === 3 && "@md/doc:col-span-1"
          )} style={{ background: block.style.background || "var(--doc-surface)", textAlign: block.style.align === "center" ? "center" : "start" }}>
          <div
            className="leading-none font-semibold tabular-nums"
            style={{ fontSize: fluid(block.style.fontSize ?? 40), fontFamily: fontVar(theme.headingFont), color: block.style.color || "var(--doc-accent)" }}
          >
            <span dir="ltr" className="inline-block">{mode === "view" ? <CountUp value={item.value} /> : item.value}</span>
          </div>
          <div className="text-sm font-medium">{item.label}</div>
          {item.note ? (
            <div className="text-xs" style={{ color: "var(--doc-muted)" }}>
              {item.note}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function MapBlock({ block }: { block: Block<"map"> }) {
  const { mode, locale } = useRenderContext();
  const t = dictionaries[locale].blockUi;
  const { query, label, zoom, height } = block.props;
  return (
    <figure className="m-0 overflow-hidden border" style={{ borderRadius: block.style.borderRadius, borderColor: "var(--doc-border)", background: "var(--doc-surface)" }}>
      {mode === "export" ? (
        <div className="relative flex flex-col items-center justify-center gap-2 overflow-hidden" style={{ height: Math.min(height, 220), background: "var(--doc-accent-soft)" }}>
          <svg className="absolute inset-0 size-full opacity-[0.18]" aria-hidden>
            <defs>
              <pattern id={`grid-${block.id}`} width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M28 0H0V28" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${block.id})`} style={{ color: "var(--doc-accent)" }} />
          </svg>
          <MapPin className="relative size-9" style={{ color: "var(--doc-accent)" }} />
          <div className="relative text-xs" style={{ color: "var(--doc-muted)" }}>
            {t.exportMap}
          </div>
        </div>
      ) : (
        <div className="relative">
          <iframe src={mapEmbedUrl(query, zoom)} title={label || query} className="block w-full border-0" style={{ height }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          {mode === "edit" ? <div className="absolute inset-0" /> : null}
        </div>
      )}
      <figcaption className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <MapPin className="size-4 shrink-0" style={{ color: "var(--doc-accent)" }} />
          <span className="truncate">
            {label ? <strong className="font-semibold">{label} · </strong> : null}
            {query}
          </span>
        </span>
        {mode !== "export" ? (
          <a href={mapLinkUrl(query)} target="_blank" rel="noopener noreferrer" onClick={(e) => mode === "edit" && e.preventDefault()} className="shrink-0 text-xs font-medium" style={{ color: "var(--doc-accent)" }}>
            {t.mapOpen}
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}

export function FileBlock({ block }: { block: Block<"file"> }) {
  const { mode, locale } = useRenderContext();
  const t = dictionaries[locale].blockUi;
  const { name, size, mime, dataUrl, url, description } = block.props;
  const href = dataUrl || (isSafeUrl(url) ? url : undefined);
  const ext = (name.split(".").pop() || mime?.split("/").pop() || "").slice(0, 4).toUpperCase();
  return (
    <div className="flex items-center gap-4 border p-4" style={{ borderRadius: block.style.borderRadius, borderColor: "var(--doc-border)", background: "var(--doc-surface)", textAlign: "start" }}>
      <div className="relative flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-lg" style={{ background: "var(--doc-accent-soft)", color: "var(--doc-accent)" }}>
        {href ? <FileText className="size-5" /> : <Paperclip className="size-5" />}
        {ext && href ? <span className="mt-0.5 text-[9px] font-bold tracking-wide">{ext}</span> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{name}</div>
        <div className="mt-0.5 text-[13px]" style={{ color: "var(--doc-muted)" }}>
          {href ? [description, formatBytes(size)].filter(Boolean).join(" · ") : description || t.noFile}
        </div>
      </div>
      {href && mode !== "export" ? (
        <a
          href={href}
          download={dataUrl ? name : undefined}
          target={dataUrl ? undefined : "_blank"}
          rel="noopener noreferrer"
          onClick={(e) => mode === "edit" && e.preventDefault()}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium text-white"
          style={{ background: "var(--doc-accent)" }}
        >
          <Download className="size-4" />
          <span className="hidden @sm/doc:inline">{t.download}</span>
        </a>
      ) : null}
    </div>
  );
}
