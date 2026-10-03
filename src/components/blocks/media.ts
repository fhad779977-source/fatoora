export type VideoSource =
  | { kind: "youtube"; id: string; embed: string }
  | { kind: "vimeo"; id: string; embed: string }
  | { kind: "file"; src: string }
  | { kind: "unknown" };

export function parseVideoUrl(url: string): VideoSource {
  const value = url.trim();
  if (!value) return { kind: "unknown" };
  if (value.startsWith("data:video/") || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(value)) return { kind: "file", src: value };
  const yt = value.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (yt) return { kind: "youtube", id: yt[1], embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0` };
  const vm = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) return { kind: "vimeo", id: vm[1], embed: `https://player.vimeo.com/video/${vm[1]}` };
  return { kind: "unknown" };
}

export function mapEmbedUrl(query: string, zoom: number) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
}

export function mapLinkUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function formatBytes(bytes?: number) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isSafeUrl(url: string | undefined): url is string {
  if (!url) return false;
  const v = url.trim();
  return /^(https?:|mailto:|tel:|\/|#)/i.test(v) && v !== "https://" && v !== "http://";
}
