"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  const t = useT();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <FileQuestion className="size-10 text-copper" />
      <div>
        <h1 className="font-display text-3xl font-semibold">{t.notFound.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.notFound.body}</p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard">{t.common.dashboard}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{t.common.home}</Link>
        </Button>
      </div>
    </div>
  );
}
