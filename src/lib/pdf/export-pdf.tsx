"use client";

import { createRoot } from "react-dom/client";
import type { MidadDocument, PageSize } from "@/lib/types";
import { DocumentSurface } from "@/components/document/document-surface";
import { DocumentRenderer } from "@/components/document/document-renderer";
import { safeFileName } from "@/lib/format";

/** Page geometry in CSS px (rendering width) and physical size in mm. */
const PAGE: Record<PageSize, { widthPx: number; heightPx?: number; widthMm: number; heightMm?: number; orientation: "p" | "l"; contentMax?: number }> = {
  a4: { widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297, orientation: "p" },
  // Content column is narrower than the slide so media (16:9 video, maps) fits on one page.
  presentation: { widthPx: 1280, heightPx: 720, widthMm: 338.67, heightMm: 190.5, orientation: "l", contentMax: 900 },
  long: { widthPx: 794, widthMm: 210, orientation: "p" },
};

const PAGE_MARGIN_PX = 40;
const MAX_PDF_PAGE_MM = 5000; // jsPDF / PDF viewers limit (~14400pt)

async function waitForAssets(root: HTMLElement) {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (document.fonts?.ready) await document.fonts.ready;
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
            setTimeout(resolve, 6000);
          })
    )
  );
}

/** Choose page break positions preferring the gaps between blocks. */
export function computeBreaks(total: number, pageContent: number, blocks: { top: number; bottom: number; keepWithNext?: boolean }[]) {
  const candidates: number[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const next = blocks[i + 1];
    // Never leave a heading/divider alone at the bottom of a page.
    if (next && !blocks[i].keepWithNext) candidates.push(Math.round((blocks[i].bottom + next.top) / 2));
  }
  const slices: [number, number][] = [];
  // Ignore trailing padding so it never produces an empty last page.
  const contentEnd = blocks.length ? Math.max(...blocks.map((b) => b.bottom)) : total;
  let y = 0;
  while (y < total - 1) {
    const limit = y + pageContent;
    if (limit >= total || limit >= contentEnd) {
      slices.push([y, Math.min(total, limit)]);
      break;
    }
    const fit = candidates.filter((c) => c > y + pageContent * 0.4 && c <= limit);
    const end = fit.length ? Math.max(...fit) : limit;
    slices.push([y, end]);
    y = end;
  }
  return slices;
}

export async function exportDocumentToPdf(doc: MidadDocument, size: PageSize, fileName?: string) {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const geometry = PAGE[size];

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;top:0;left:-20000px;width:${geometry.widthPx}px;pointer-events:none;z-index:-1;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    root.render(
      <DocumentSurface theme={doc.theme} language={doc.language} fixedWidth={geometry.widthPx} contentMaxWidth={geometry.contentMax}>
        <DocumentRenderer doc={doc} mode="export" canFill={false} />
      </DocumentSurface>
    );
    await waitForAssets(host);
    const surface = host.firstElementChild as HTMLElement;
    if (!surface) throw new Error("render failed");

    const surfaceTop = surface.getBoundingClientRect().top;
    const blocks = Array.from(surface.querySelectorAll<HTMLElement>("[data-export-block]")).map((el) => {
      const r = el.getBoundingClientRect();
      const type = el.querySelector("[data-block-type]")?.getAttribute("data-block-type");
      return { top: r.top - surfaceTop, bottom: r.bottom - surfaceTop, keepWithNext: type === "heading" || type === "divider" };
    });
    const totalHeight = Math.ceil(surface.scrollHeight);
    const width = geometry.widthPx;

    // Keep the canvas under browser limits (height ≤ 32k px, area ≤ ~250M px).
    const ratio = Math.max(1, Math.min(2, 30000 / totalHeight, Math.sqrt(240_000_000 / (width * totalHeight))));
    const canvas = await toCanvas(surface, {
      pixelRatio: ratio,
      backgroundColor: doc.theme.background,
      width,
      height: totalHeight,
      cacheBust: false,
      imagePlaceholder:
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><rect width="4" height="3" fill="#ECE6D8"/></svg>'),
    });

    const pdf = new jsPDF({
      orientation: geometry.orientation,
      unit: "mm",
      format: geometry.heightMm ? [geometry.widthMm, geometry.heightMm] : [geometry.widthMm, Math.min(MAX_PDF_PAGE_MM, (geometry.widthMm * totalHeight) / width)],
      compress: true,
    });
    pdf.setProperties({ title: doc.title, creator: "MIDAD", subject: doc.title });

    const mmPerPx = geometry.widthMm / width;
    const pageHeightPx = geometry.heightPx ?? Math.floor(MAX_PDF_PAGE_MM / mmPerPx);
    const isLong = size === "long";
    const marginPx = isLong ? 0 : PAGE_MARGIN_PX;
    // First page starts at the very top (the surface has its own padding); following pages get a top margin.
    const slices = isLong && totalHeight <= pageHeightPx ? [[0, totalHeight] as [number, number]] : computeBreaks(totalHeight, pageHeightPx - marginPx * 2, blocks);

    slices.forEach(([start, end], index) => {
      const sliceHeight = end - start;
      const pageH = isLong ? sliceHeight : pageHeightPx;
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = Math.round(width * ratio);
      pageCanvas.height = Math.round(pageH * ratio);
      const ctx = pageCanvas.getContext("2d")!;
      ctx.fillStyle = doc.theme.background;
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      const offsetY = isLong || index === 0 ? 0 : marginPx;
      ctx.drawImage(canvas, 0, Math.round(start * ratio), canvas.width, Math.round(sliceHeight * ratio), 0, Math.round(offsetY * ratio), pageCanvas.width, Math.round(sliceHeight * ratio));

      const pageWidthMm = geometry.widthMm;
      const pageHeightMm = pageH * mmPerPx;
      if (index > 0) pdf.addPage(isLong ? [pageWidthMm, pageHeightMm] : [geometry.widthMm, geometry.heightMm!], geometry.orientation);
      pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");
    });

    const name = `${safeFileName(fileName ?? doc.title)}.pdf`;
    // Explicit anchor download keeps the document title as the file name across browsers.
    const url = URL.createObjectURL(pdf.output("blob"));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return { pages: slices.length, name };
  } finally {
    root.unmount();
    host.remove();
  }
}
