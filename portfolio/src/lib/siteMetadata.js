import { plainText } from "./text";
import { safeUrl } from "./url";

/** Absolute site URL, used to turn "/profile.png" into a full link for previews. */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/** Site-wide <head> tags from Admin → Settings. */
export function buildSiteMetadata({ settings, profile }) {
  const title = plainText(settings.seo_title || settings.site_title || profile.name);
  const description = settings.seo_description;
  const image = safeUrl(settings.og_image);

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s — ${profile.name}` },
    description,
    keywords: settings.seo_keywords,
    authors: [{ name: profile.name }],
    icons: { icon: safeUrl(settings.favicon_url) || "/favicon.svg" },
    openGraph: { type: "website", title, description, images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}
