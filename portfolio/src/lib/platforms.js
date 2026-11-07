import { safeUrl } from "./url.js";

/**
 * Freelance marketplaces, recognised from the social links in the profile.
 * Adding an Upwork or Fiverr URL in Admin → Profile → Social profiles is
 * enough for the "Hire me on…" buttons to appear across the site.
 */
const PLATFORMS = [
  { id: "upwork", name: "Upwork", action: "Hire me on Upwork", host: /(^|\.)upwork\.com$/i },
  { id: "fiverr", name: "Fiverr", action: "Order on Fiverr", host: /(^|\.)fiverr\.com$/i },
  { id: "freelancer", name: "Freelancer", action: "Hire me on Freelancer", host: /(^|\.)freelancer\.com$/i },
];

function platformFor(url) {
  const safe = safeUrl(url);
  if (!safe || !/^https?:\/\//i.test(safe)) return null;
  const host = new URL(safe).hostname;
  return PLATFORMS.find((p) => p.host.test(host)) ?? null;
}

/** [{ id, name, action, url }] for every marketplace link in the profile. */
export function hirePlatforms(socials = []) {
  return socials
    .map((s) => {
      const platform = platformFor(s.url);
      return platform ? { ...platform, url: safeUrl(s.url) } : null;
    })
    .filter(Boolean);
}

const WHATSAPP_HOST = /(^|\.)(wa\.me|whatsapp\.com)$/i;

/**
 * The WhatsApp number from a social link such as "https://wa.me/923001234567"
 * (international format, digits only), or null when there isn't one.
 */
export function whatsappNumber(socials = []) {
  for (const s of socials) {
    const safe = safeUrl(s.url);
    if (!safe || !/^https?:\/\//i.test(safe)) continue;
    const url = new URL(safe);
    if (!WHATSAPP_HOST.test(url.hostname)) continue;
    const digits = (url.searchParams.get("phone") || url.pathname).replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) return digits;
  }
  return null;
}

/** A wa.me chat link with a friendly opening message already typed in. */
export function whatsappChatUrl(number, name) {
  const first = String(name || "").trim().split(/\s+/)[0];
  const text = `Hi${first ? ` ${first}` : ""}! I saw your portfolio and would like to discuss a project.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Social links that aren't marketplaces (those get their own buttons). */
export function otherSocials(socials = []) {
  return socials.filter((s) => !platformFor(s.url));
}
