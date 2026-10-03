import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { MidadDocument } from "@/lib/types";
import { normalizeDocument } from "@/lib/document";

/** Above this length an embedded link becomes impractical to share. */
export const MAX_EMBED_LENGTH = 60_000;

export function sharePath(doc: Pick<MidadDocument, "slug">) {
  return `/s/${encodeURIComponent(doc.slug)}`;
}

export function encodeDocument(doc: MidadDocument): string {
  return compressToEncodedURIComponent(JSON.stringify(doc));
}

export function decodeDocument(payload: string): MidadDocument | null {
  try {
    const json = decompressFromEncodedURIComponent(payload);
    return json ? normalizeDocument(JSON.parse(json)) : null;
  } catch {
    return null;
  }
}

export function buildShareUrl(origin: string, doc: MidadDocument, embed: boolean) {
  const base = `${origin}${sharePath(doc)}`;
  if (!embed) return { url: base, tooLarge: false };
  const payload = encodeDocument(doc);
  if (payload.length > MAX_EMBED_LENGTH) return { url: base, tooLarge: true };
  return { url: `${base}#d=${payload}`, tooLarge: false };
}
