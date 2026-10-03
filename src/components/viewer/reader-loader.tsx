"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileQuestion } from "lucide-react";
import type { MidadDocument } from "@/lib/types";
import { getRepository } from "@/lib/storage/idb-repository";
import { decodeDocument } from "@/lib/share";
import { useT } from "@/lib/i18n/use-t";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { DocumentReader } from "./document-reader";

type State = { status: "loading" } | { status: "missing" } | { status: "ready"; doc: MidadDocument; embedded: boolean };

/** Resolves a document by id (owner preview) or by slug / embedded payload (share link). */
export function ReaderLoader({ by, value }: { by: "id" | "slug"; value: string }) {
  const t = useT();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let doc: MidadDocument | undefined;
      let embedded = false;
      if (by === "id") doc = await getRepository().get(value);
      else {
        doc = await getRepository().getBySlug(value);
        const payload = window.location.hash.match(/[#&]d=([^&]+)/)?.[1];
        if (!doc && payload) {
          doc = decodeDocument(payload) ?? undefined;
          embedded = !!doc;
        }
      }
      if (cancelled) return;
      if (doc) document.title = `${doc.title} · مِداد`;
      setState(doc ? { status: "ready", doc, embedded } : { status: "missing" });
    })();
    return () => {
      cancelled = true;
    };
  }, [by, value]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-copper border-t-transparent" aria-label={t.common.loading} />
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <Logo />
        <FileQuestion className="size-10 text-copper" />
        <div>
          <h1 className="font-display text-3xl font-semibold">{t.viewer.notFound}</h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t.viewer.notFoundBody}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard">{t.viewer.createYours}</Link>
        </Button>
      </div>
    );
  }

  return <DocumentReader doc={state.doc} variant={by === "id" ? "owner" : "shared"} embedded={state.embedded} />;
}
