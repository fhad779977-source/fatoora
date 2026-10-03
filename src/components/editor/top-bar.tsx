"use client";

import Link from "next/link";
import { AlertCircle, Check, Cloud, Ellipsis, Eye, FileDown, History, Languages, LoaderCircle, Monitor, Moon, Pencil, Redo2, Share2, Smartphone, Sun, Undo2 } from "lucide-react";
import { useEditor } from "@/lib/stores/editor-store";
import { useSettings } from "@/lib/stores/settings-store";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function SaveIndicator() {
  const t = useT();
  const { locale } = useLocale();
  const status = useEditor((s) => s.saveStatus);
  const savedAt = useEditor((s) => s.lastSavedAt);
  const map = {
    saved: { icon: Check, label: t.editor.autosaved, cls: "text-muted-foreground" },
    dirty: { icon: Cloud, label: t.editor.unsaved, cls: "text-muted-foreground" },
    saving: { icon: LoaderCircle, label: t.editor.autosaving, cls: "text-copper" },
    error: { icon: AlertCircle, label: t.editor.saveFailed, cls: "text-destructive" },
  }[status];
  return (
    <Hint label={savedAt ? `${t.editor.autosaved} · ${formatTime(savedAt, locale)}` : map.label}>
      <span className={cn("hidden items-center gap-1.5 text-xs whitespace-nowrap sm:flex", map.cls)} role="status" aria-live="polite">
        <map.icon className={cn("size-3.5", status === "saving" && "animate-spin")} />
        <span className="hidden lg:inline">{map.label}</span>
      </span>
    </Hint>
  );
}

export function EditorTopBar({ onShare, onExport, onHistory, onSave }: { onShare: () => void; onExport: () => void; onHistory: () => void; onSave: () => void }) {
  const t = useT();
  const doc = useEditor((s) => s.doc)!;
  const mode = useEditor((s) => s.mode);
  const device = useEditor((s) => s.device);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const { setMode, setDevice, undo, redo, updateDoc } = useEditor.getState();
  const theme = useSettings((s) => s.theme);
  const { toggleTheme, toggleLocale } = useSettings.getState();
  const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

  return (
    <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-2 backdrop-blur-xl sm:gap-3 sm:px-3">
      <Hint label={t.editor.backToDashboard}>
        <Link href="/dashboard" className="shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40" aria-label={t.editor.backToDashboard}>
          <LogoMark className="size-8" />
        </Link>
      </Hint>
      <input
        value={doc.title}
        onChange={(e) => updateDoc({ title: e.target.value }, "title")}
        placeholder={t.editor.titlePlaceholder}
        aria-label={t.editor.titlePlaceholder}
        className="h-9 min-w-0 flex-1 truncate rounded-lg border border-transparent bg-transparent px-2 font-display text-lg font-semibold outline-none transition-colors hover:border-border focus:border-ring focus:bg-card sm:max-w-sm"
      />
      <SaveIndicator />

      <div className="ms-auto flex items-center gap-1">
        <div className="hidden items-center md:flex">
          <Hint label={`${t.editor.undo} (${mod}+Z)`}>
            <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} aria-label={t.editor.undo}>
              <Undo2 className="rtl:-scale-x-100" />
            </Button>
          </Hint>
          <Hint label={`${t.editor.redo} (${mod}+Shift+Z)`}>
            <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} aria-label={t.editor.redo}>
              <Redo2 className="rtl:-scale-x-100" />
            </Button>
          </Hint>
        </div>

        <div className="hidden items-center rounded-lg bg-muted p-0.5 sm:flex" role="group" aria-label={t.editor.device}>
          {(["edit", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all", mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {m === "edit" ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
              {m === "edit" ? t.editor.editMode : t.editor.previewMode}
            </button>
          ))}
        </div>

        <div className="hidden items-center rounded-lg bg-muted p-0.5 lg:flex">
          {(["desktop", "mobile"] as const).map((d) => (
            <Hint key={d} label={d === "desktop" ? t.editor.desktop : t.editor.mobile}>
              <button
                type="button"
                onClick={() => setDevice(d)}
                className={cn("flex size-7 items-center justify-center rounded-md transition-all", device === d ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                aria-label={d === "desktop" ? t.editor.desktop : t.editor.mobile}
                aria-pressed={device === d}
              >
                {d === "desktop" ? <Monitor className="size-3.5" /> : <Smartphone className="size-3.5" />}
              </button>
            </Hint>
          ))}
        </div>

        <div className="hidden items-center xl:flex">
          <Hint label={t.editor.history}>
            <Button variant="ghost" size="icon-sm" onClick={onHistory} aria-label={t.editor.history}>
              <History />
            </Button>
          </Hint>
          <Hint label={t.common.language}>
            <Button variant="ghost" size="icon-sm" onClick={toggleLocale} aria-label={t.common.language}>
              <Languages />
            </Button>
          </Hint>
          <Hint label={theme === "dark" ? t.common.lightMode : t.common.darkMode}>
            <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label={t.common.darkMode}>
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </Hint>
          <Hint label={t.common.preview}>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={`/view/${doc.id}`} target="_blank" aria-label={t.common.preview}>
                <Eye />
              </Link>
            </Button>
          </Hint>
        </div>

        <Button variant="outline" size="sm" onClick={onExport} className="hidden md:inline-flex">
          <FileDown />
          <span className="hidden lg:inline">{t.common.exportPdf}</span>
        </Button>
        <Button variant="copper" size="sm" onClick={onShare}>
          <Share2 />
          <span className="hidden sm:inline">{t.common.share}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="xl:hidden" aria-label="more">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={undo} disabled={!canUndo} className="md:hidden">
              <Undo2 className="rtl:-scale-x-100" />
              {t.editor.undo}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={redo} disabled={!canRedo} className="md:hidden">
              <Redo2 className="rtl:-scale-x-100" />
              {t.editor.redo}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setMode(mode === "edit" ? "preview" : "edit")} className="sm:hidden">
              {mode === "edit" ? <Eye /> : <Pencil />}
              {mode === "edit" ? t.editor.previewMode : t.editor.editMode}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDevice(device === "desktop" ? "mobile" : "desktop")} className="lg:hidden">
              {device === "desktop" ? <Smartphone /> : <Monitor />}
              {device === "desktop" ? t.editor.mobile : t.editor.desktop}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/view/${doc.id}`} target="_blank">
                <Eye />
                {t.common.preview}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExport} className="md:hidden">
              <FileDown />
              {t.common.exportPdf}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onSave}>
              <Check />
              {t.common.save}
              <span className="ms-auto text-[10px] text-muted-foreground" dir="ltr">{mod}+S</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onHistory}>
              <History />
              {t.editor.history}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={toggleLocale}>
              <Languages />
              {t.common.language}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={toggleTheme}>
              {theme === "dark" ? <Sun /> : <Moon />}
              {theme === "dark" ? t.common.lightMode : t.common.darkMode}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
