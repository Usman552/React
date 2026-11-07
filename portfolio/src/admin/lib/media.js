import { describeError, invokeFunction } from "./errors";
import { MEDIA_BUCKET, supabase } from "./supabase";

const MAX_DEPTH = 4;
const PAGE = 1000;

export const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i;

export function publicUrl(path) {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** "…/object/public/media/projects/a/b.webp?x" → "projects/a/b.webp", or null for other URLs. */
export function pathFromUrl(url) {
  const match = /\/object\/public\/media\/([^?#]+)/.exec(String(url || ""));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Every file in the media bucket, newest first. Folders are walked a few levels deep. */
export async function listMedia() {
  const files = [];

  async function walk(prefix, depth) {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list(prefix, { limit: PAGE, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;

    const folders = [];
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        if (depth < MAX_DEPTH) folders.push(path);
        continue;
      }
      if (entry.name === ".emptyFolderPlaceholder") continue;
      files.push({
        path,
        name: entry.name,
        folder: prefix.split("/")[0] || "root",
        size: entry.metadata?.size ?? 0,
        type: entry.metadata?.mimetype ?? "",
        created_at: entry.created_at,
        url: publicUrl(path),
        isImage: (entry.metadata?.mimetype || "").startsWith("image/") || IMAGE_EXT.test(entry.name),
      });
    }
    await Promise.all(folders.map((folder) => walk(folder, depth + 1)));
  }

  await walk("", 0);
  return files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Where each stored file is used: Map(path → [{ label, to }]).
 * Covers the profile, settings, projects and experience.
 */
export async function findUsage() {
  const [profile, settings, projects, experience] = await Promise.all([
    supabase.from("profile").select("photo_url, resume_url").eq("id", 1).maybeSingle(),
    supabase.from("site_settings").select("og_image, favicon_url").eq("id", 1).maybeSingle(),
    supabase.from("projects").select("id, title, thumbnail_url, gallery"),
    supabase.from("experience").select("id, title, logo_url"),
  ]);
  const failed = [profile, settings, projects, experience].find((r) => r.error);
  if (failed) throw failed.error;

  const usage = new Map();
  const add = (url, label, to) => {
    const path = pathFromUrl(url);
    if (!path) return;
    usage.set(path, [...(usage.get(path) || []), { label, to }]);
  };

  add(profile.data?.photo_url, "Profile photo", "/admin/profile");
  add(profile.data?.resume_url, "Resume", "/admin/profile");
  add(settings.data?.og_image, "Social sharing image", "/admin/settings");
  add(settings.data?.favicon_url, "Favicon", "/admin/settings");
  for (const p of projects.data) {
    add(p.thumbnail_url, `${p.title} · cover`, `/admin/projects/${p.id}`);
    (p.gallery || []).forEach((g) => add(g.url, `${p.title} · gallery`, `/admin/projects/${p.id}`));
  }
  for (const e of experience.data) add(e.logo_url, `${e.title} · logo`, "/admin/experience");
  return usage;
}

export async function deleteMedia(paths) {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  if (error) throw error;
}

/**
 * Captures a screenshot of a public page on the server (project-screenshot
 * Edge Function) and returns its public URL.
 */
export async function captureScreenshot(url, folder = "misc") {
  try {
    const { path } = await invokeFunction(supabase, "project-screenshot", { url, folder });
    return publicUrl(path);
  } catch (err) {
    throw new Error(describeError(err, "Screenshot failed."), { cause: err });
  }
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
