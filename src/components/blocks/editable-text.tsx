"use client";

import { useEffect, useRef, type CSSProperties, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange?: (value: string) => void;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  multiline?: boolean;
}

/**
 * Uncontrolled contentEditable that reports plain text. When `onChange` is not
 * provided it renders static text, so the same component serves edit & view.
 */
export function EditableText({ value, onChange, as: Tag = "div", className, style, placeholder, multiline = true }: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onChange) return;
    // Only sync from props when the user isn't typing in this element (undo/redo, inspector edits).
    if (document.activeElement !== el && el.innerText !== value) el.innerText = value;
  }, [value, onChange]);

  if (!onChange) {
    return (
      <Tag className={cn("whitespace-pre-line", className)} style={style}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-inline-edit
      data-placeholder={placeholder}
      spellCheck={false}
      className={cn("cursor-text whitespace-pre-line rounded-sm transition-shadow", className)}
      style={style}
      onInput={(e: React.FormEvent<HTMLElement>) => onChange((e.currentTarget as HTMLElement).innerText.replace(/\n$/, ""))}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onPaste={(e: React.ClipboardEvent<HTMLElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, multiline ? text : text.replace(/\n/g, " "));
      }}
    />
  );
}
