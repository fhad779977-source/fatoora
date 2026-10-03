export function uid(prefix = ""): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return prefix ? `${prefix}_${rand}` : rand;
}

/** Arabic-friendly slug: keeps Arabic letters, latin letters and digits. */
export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "") // strip harakat
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "document";
}

export function uniqueSlug(title: string): string {
  return `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
}
