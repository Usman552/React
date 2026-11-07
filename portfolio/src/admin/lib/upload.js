import { MEDIA_BUCKET, supabase } from "./supabase";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 1600;

export const ACCEPT_IMAGES = IMAGE_TYPES.join(",");
export const ACCEPT_PDF = "application/pdf";

/** Downscales large photos and re-encodes them as WebP. GIFs are left alone. */
async function optimizeImage(file) {
  if (file.type === "image/gif" || typeof createImageBitmap !== "function") return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  // Keep the original if re-encoding didn't help (already small/optimised).
  return blob && blob.size < file.size ? new File([blob], "image.webp", { type: "image/webp" }) : file;
}

export function checkFile(file, kind) {
  if (!file) return "No file selected.";
  if (kind === "pdf") {
    if (file.type !== "application/pdf") return "Upload a PDF file.";
    if (file.size > MAX_PDF_BYTES) return "PDF must be under 10 MB.";
    return null;
  }
  if (!IMAGE_TYPES.includes(file.type)) return "Use a PNG, JPG, WebP, AVIF or GIF image.";
  if (file.size > MAX_IMAGE_BYTES) return "Image must be under 8 MB.";
  return null;
}

const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

/** Uploads to the public media bucket and returns its public URL. */
export async function uploadMedia(file, folder, kind = "image") {
  const problem = checkFile(file, kind);
  if (problem) throw new Error(problem);

  const body = kind === "image" ? await optimizeImage(file) : file;
  const id = crypto.randomUUID().slice(0, 8);
  const path = `${folder}/${Date.now()}-${id}.${EXTENSIONS[body.type]}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
    contentType: body.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;

  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
