import type { AnyBlock, Locale } from "@/lib/types";
import { createBlock } from "@/lib/blocks/registry";
import { createDocument } from "@/lib/document";

/** Convert Markdown / plain text into MIDAD blocks (headings, quotes, dividers, paragraphs, simple tables). */
export function documentFromText(text: string, fileName: string, locale: Locale) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: AnyBlock[] = [];
  let paragraph: string[] = [];
  let title = "";

  const flush = () => {
    const value = paragraph.join("\n").trim();
    if (value) blocks.push(createBlock("text", locale, { props: { text: value.replace(/\*\*(.+?)\*\*/g, "$1") } }) as AnyBlock);
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flush();
      const level = heading[1].length as 1 | 2 | 3;
      if (!title) title = heading[2];
      blocks.push(createBlock("heading", locale, { props: { text: heading[2], level } }) as AnyBlock);
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flush();
      blocks.push(createBlock("divider", locale) as AnyBlock);
    } else if (line.startsWith(">")) {
      flush();
      blocks.push(createBlock("quote", locale, { props: { text: line.replace(/^>\s?/, ""), author: "" } }) as AnyBlock);
    } else if (line.startsWith("|") && lines[i + 1]?.trim().match(/^\|?\s*:?-{3,}/)) {
      flush();
      const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const headers = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(cells(lines[i++]));
      i--;
      blocks.push(createBlock("table", locale, { props: { headers, rows, striped: true } }) as AnyBlock);
    } else if (!line) {
      flush();
    } else {
      paragraph.push(line.replace(/^[-*]\s+/, "• "));
    }
  }
  flush();

  return createDocument({ title: title || fileName.replace(/\.[^.]+$/, ""), language: locale, blocks });
}
