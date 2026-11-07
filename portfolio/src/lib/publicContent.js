import { defaultContent, defaultSettings } from "../data/defaults.js";
import { accentThemes, THEME_MODES } from "../data/site.js";

// The public site reads Supabase with plain fetch: no SDK in the public bundle.
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const backendConfigured = Boolean(SUPABASE_URL && PUBLIC_KEY);

/** Cache tag for everything the public site shows; see /api/revalidate. */
export const CONTENT_TAG = "content";

function headers() {
  return { apikey: PUBLIC_KEY, "Content-Type": "application/json" };
}

/**
 * Fills gaps with defaults so a partially-filled database never breaks a
 * section. Lists are taken as-is: an empty list in the database is a choice.
 */
export function normalizeContent(raw) {
  if (!raw || typeof raw !== "object" || !raw.profile || !raw.profile.name) return null;

  const settings = { ...defaultSettings, ...(raw.settings || {}) };
  const sections = {};
  for (const [key, fallback] of Object.entries(defaultSettings.sections)) {
    sections[key] = { ...fallback, ...(settings.sections?.[key] || {}) };
  }

  return {
    profile: { ...defaultContent.profile, ...raw.profile },
    settings: {
      ...settings,
      sections,
      project_display: { ...defaultSettings.project_display, ...(settings.project_display || {}) },
      theme: normalizeTheme(settings.theme),
    },
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    services: Array.isArray(raw.services) ? raw.services : [],
    skill_categories: Array.isArray(raw.skill_categories) ? raw.skill_categories : [],
    experience: Array.isArray(raw.experience) ? raw.experience : [],
  };
}

/** Theme settings with unknown values replaced by the defaults. */
export function normalizeTheme(theme) {
  const merged = { ...defaultSettings.theme, ...(theme && typeof theme === "object" ? theme : {}) };
  return {
    mode: THEME_MODES.includes(merged.mode) ? merged.mode : defaultSettings.theme.mode,
    allow_toggle: merged.allow_toggle !== false,
    accent: accentThemes[merged.accent] ? merged.accent : defaultSettings.theme.accent,
  };
}

/**
 * Server-side: loads all public content in one request. Cached by Next.js and
 * refreshed every 5 minutes, or immediately when the admin saves something.
 * Falls back to the built-in defaults when Supabase isn't configured or down.
 */
export async function loadPublicContent() {
  if (!backendConfigured) return defaultContent;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_content`, {
      headers: headers(),
      next: { revalidate: 300, tags: [CONTENT_TAG] },
    });
    if (!res.ok) throw new Error(`Content request failed (${res.status})`);
    return normalizeContent(await res.json()) ?? defaultContent;
  } catch (err) {
    console.error("Falling back to built-in content:", err.message);
    return defaultContent;
  }
}

/**
 * Browser-side: sends the contact form to the contact-submit Edge Function.
 * Resolves { ok: true } or { ok: false, error, fields }.
 */
export async function submitContact(payload) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/contact-submit`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true };
    return { ok: false, error: body.error || "Could not send your message.", fields: body.fields || {} };
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again.", fields: {} };
  }
}
