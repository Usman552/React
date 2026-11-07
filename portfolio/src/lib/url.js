/**
 * Returns the URL if it is safe to put in an href/src, otherwise null.
 * Allows http(s), mailto:, site-relative paths and in-page anchors.
 * Rejects javascript:, data:, protocol-relative URLs and anything with spaces.
 */
export function safeUrl(value) {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;
  if (/^https?:\/\/[^\s<>"]+$/i.test(url)) return url;
  if (/^mailto:[^\s<>"]+$/i.test(url)) return url;
  if (/^#[A-Za-z0-9_-]*$/.test(url)) return url;
  if (url === "/" || /^\/[^/\s<>"][^\s<>"]*$/.test(url)) return url;
  return null;
}

export function isExternal(url) {
  return /^https?:\/\//i.test(url);
}
