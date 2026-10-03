export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Load an image file and downscale it so documents stay light enough for storage/sharing. */
export async function imageFileToDataUrl(file: File, maxSide = 1800): Promise<string> {
  const original = await readAsDataUrl(file);
  if (file.type === "image/svg+xml" || file.type === "image/gif") return original;
  const img = new Image();
  img.src = original;
  await img.decode();
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && file.size < 900_000) return original;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const usePng = file.type === "image/png" && file.size < 1_500_000;
  return canvas.toDataURL(usePng ? "image/png" : "image/jpeg", 0.86);
}
