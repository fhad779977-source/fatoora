"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Briefcase, Building2, Clock4, EyeOff, Landmark, MonitorSmartphone, PenTool, RefreshCw, Scale } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { cn } from "@/lib/utils";
import { useCreateDocument } from "@/hooks/use-create-document";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LocaleToggle, ThemeToggle } from "@/components/shared/preferences";
import { ComparePoints } from "@/components/dashboard/compare-card";
import { TemplateGallery } from "@/components/dashboard/template-gallery";
import { HeroMockup } from "./hero-mockup";
import { Reveal, SectionHeading } from "./reveal";

export function LandingView() {
  const t = useT();
  const { dir } = useLocale();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const { createDocument, pending } = useCreateDocument();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { href: "#problem", label: t.nav.features },
    { href: "#how", label: t.nav.how },
    { href: "#compare", label: t.nav.compare },
    { href: "#templates", label: t.nav.templates },
  ];

  const problemIcons = [RefreshCw, MonitorSmartphone, EyeOff];
  const useIcons = [Building2, Landmark, PenTool, Scale];

  return (
    <div className="min-h-dvh overflow-x-clip">
      {/* Navigation */}
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-500", scrolled ? "border-b hairline bg-background/80 backdrop-blur-xl" : "bg-transparent")}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
          <Link href="/" aria-label={t.brand.name}>
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <LocaleToggle compact />
            <ThemeToggle />
            <Button asChild size="sm" className="ms-1">
              <Link href="/dashboard">{t.nav.openApp}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-24 sm:pt-36 lg:pb-32">
        <div className="pointer-events-none absolute inset-0 paper-grain [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper-soft px-3 py-1 text-xs font-medium text-copper">
              <span className="size-1.5 rounded-full bg-copper" />
              {t.landing.eyebrow}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-display text-[44px] leading-[1.08] font-semibold text-balance sm:text-6xl lg:text-7xl"
            >
              {t.landing.title}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.18 }} className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t.landing.subtitle}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.28 }} className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" variant="copper" onClick={() => createDocument("blank")} disabled={!!pending}>
                {t.landing.ctaPrimary}
                <Arrow />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#templates">{t.landing.ctaSecondary}</a>
              </Button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock4 className="size-3.5 text-copper" />
              {t.landing.privacy}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <HeroMockup />
            <div className="mt-16 text-center text-[11px] tracking-wide text-muted-foreground">{t.landing.liveDemo}</div>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="scroll-mt-20 border-t hairline py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow={t.landing.problemEyebrow} title={t.landing.problemTitle} />
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {t.landing.problems.map((p, i) => {
              const Icon = problemIcons[i];
              return (
                <Reveal key={p.title} delay={i * 0.08}>
                  <div className="h-full rounded-3xl border bg-card p-7">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold">{p.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative scroll-mt-20 overflow-hidden bg-navy py-24 text-ivory sm:py-32">
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow={t.landing.howEyebrow} title={t.landing.howTitle} invert />
          <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
            {t.landing.steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="relative border-t border-white/10 pt-8">
                  <motion.div
                    className="absolute -top-px start-0 h-px bg-copper"
                    initial={{ width: 0 }}
                    whileInView={{ width: "40%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.15 }}
                  />
                  <div className="font-display text-6xl font-semibold text-copper/90 tabular-nums">0{i + 1}</div>
                  <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-blue">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Compare */}
      <section id="compare" className="scroll-mt-20 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading eyebrow={t.landing.compareEyebrow} title={t.landing.compareTitle} align="center" />
          <Reveal className="mt-14">
            <ComparePoints variant="large" />
          </Reveal>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-y hairline bg-card/40 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow={t.landing.useEyebrow} title={t.landing.useTitle} />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {t.landing.uses.map((u, i) => {
              const Icon = useIcons[i] ?? Briefcase;
              return (
                <Reveal key={u.title} delay={i * 0.06} className="bg-background">
                  <div className="group h-full p-7 transition-colors hover:bg-card">
                    <Icon className="size-6 text-copper transition-transform duration-500 group-hover:-translate-y-1" />
                    <h3 className="mt-8 text-lg font-semibold">{u.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{u.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="scroll-mt-20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow={t.landing.templatesEyebrow} title={t.landing.templatesTitle} body={t.landing.templatesBody} />
          <div className="mt-12">
            <TemplateGallery onPick={createDocument} pending={pending} includeBlank={false} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-navy px-6 py-20 text-center text-ivory sm:px-12 sm:py-24">
            <div className="pointer-events-none absolute inset-0 opacity-50 paper-grain" />
                        <h2 className="relative mx-auto max-w-2xl font-display text-4xl leading-tight font-semibold text-balance sm:text-6xl">{t.landing.finalTitle}</h2>
            <p className="relative mx-auto mt-5 max-w-xl text-lg text-slate-blue">{t.landing.finalBody}</p>
            <div className="relative mt-10 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="copper" onClick={() => createDocument("blank")} disabled={!!pending}>
                {t.landing.finalCta}
                <Arrow />
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/15 bg-white/5 text-ivory hover:bg-white/10 hover:text-ivory">
                <Link href="/dashboard">{t.common.dashboard}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t hairline">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.landing.footerNote}</p>
            <p className="mt-2 font-display text-lg text-copper">«{t.brand.tagline}»</p>
          </div>
          <div>
            <div className="text-sm font-semibold">{t.landing.footerProduct}</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#problem" className="hover:text-foreground">{t.nav.features}</a></li>
              <li><a href="#how" className="hover:text-foreground">{t.nav.how}</a></li>
              <li><a href="#templates" className="hover:text-foreground">{t.nav.templates}</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">{t.landing.footerResources}</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground">{t.common.dashboard}</Link></li>
              <li><button type="button" onClick={() => createDocument("blank")} className="hover:text-foreground">{t.common.newDocument}</button></li>
              <li><a href="#compare" className="hover:text-foreground">{t.nav.compare}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t hairline">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
            <span>© {new Date().getFullYear()} {t.brand.name} · {t.landing.footerRights}</span>
            <span className="tracking-[0.3em] text-copper">MIDAD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
