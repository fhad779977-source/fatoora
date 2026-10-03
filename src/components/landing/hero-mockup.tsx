"use client";

import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FileDown, Link2, MousePointerClick } from "lucide-react";
import { createDocument } from "@/lib/document";
import { getTemplate } from "@/lib/templates/catalog";
import { useT } from "@/lib/i18n/use-t";
import { DocumentThumbnail } from "@/components/document/document-thumbnail";

/** Hero visual composed of real documents rendered by the app's own renderer. */
export function HeroMockup() {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yDesk = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yPhone = useTransform(scrollYProgress, [0, 1], [90, -90]);

  const docs = useMemo(() => {
    const fin = getTemplate("financial")!;
    const port = getTemplate("portfolio")!;
    return {
      desktop: createDocument({ title: fin.title, theme: fin.theme(), blocks: fin.blocks() }),
      phone: createDocument({ title: port.title, theme: port.theme(), blocks: port.blocks() }),
    };
  }, []);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
      <motion.div style={{ y: yDesk }} className="relative rounded-[22px] border border-navy/10 bg-white p-2 shadow-2xl shadow-navy/15 dark:border-white/10 dark:bg-navy-800">
        <div className="flex items-center gap-1.5 px-2 pt-1 pb-2.5">
          <span className="size-2.5 rounded-full bg-copper/80" />
          <span className="size-2.5 rounded-full bg-slate-blue/40" />
          <span className="size-2.5 rounded-full bg-slate-blue/25" />
          <span className="mx-auto rounded-full bg-muted px-4 py-1 text-[10px] text-muted-foreground" dir="ltr">
            midad.app/s/q3-report
          </span>
        </div>
        <DocumentThumbnail doc={docs.desktop} maxBlocks={4} className="aspect-[4/3.1] w-full rounded-2xl border border-navy/5" />
      </motion.div>

      <motion.div
        style={{ y: yPhone }}
        className="absolute -bottom-12 end-1 w-[32%] sm:-end-8 rounded-[30px] border-[6px] border-navy bg-navy shadow-2xl shadow-navy/30 sm:-start-10"
      >
        <div className="absolute top-1.5 left-1/2 z-10 h-4 w-14 -translate-x-1/2 rounded-full bg-navy" />
        <DocumentThumbnail doc={docs.phone} maxBlocks={4} renderWidth={390} className="aspect-[9/18.5] w-full rounded-[24px]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute top-10 -start-3 hidden items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-xs font-medium shadow-xl shadow-navy/10 sm:flex"
      >
        <Link2 className="size-3.5 text-copper" />
        {t.landing.midadPoints[4]}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="absolute start-8 -bottom-6 hidden items-center gap-2 rounded-full bg-navy px-3.5 py-2 text-xs font-medium text-ivory shadow-xl shadow-navy/20 sm:flex"
      >
        <FileDown className="size-3.5 text-copper" />
        {t.landing.midadPoints[5]}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="absolute top-1/2 -start-6 hidden items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-xs font-medium shadow-xl shadow-navy/10 lg:flex"
      >
        <MousePointerClick className="size-3.5 text-copper" />
        {t.landing.midadPoints[3]}
      </motion.div>
    </div>
  );
}
