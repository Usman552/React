// Website screenshots for project covers. Plain JS: shared by the Edge
// Function and the Node tests.
//
// The capture itself is done by a screenshot service, so no headless browser
// runs in the Edge Function. The default is Microlink (free tier, no key).
// Set SCREENSHOT_URL_TEMPLATE to use another service: "{url}" in the template
// is replaced by the encoded page URL, and the service must answer with the
// image itself (or a redirect to it).

export const DEFAULT_TEMPLATE =
  "https://api.microlink.io/?url={url}&screenshot=true&meta=false&embed=screenshot.url" +
  "&viewport.width=1440&viewport.height=900&waitForTimeout=1500";

export const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

// Hosts a screenshot service can't reach anyway, rejected early with a clear message.
const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|0\.0\.0\.0|\[?::1\]?)$/i;

/** Returns an error message for a URL that can't be captured, or null. */
export function checkTargetUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "Enter the page URL to capture.";
  if (value.length > 2000) return "That URL is too long.";
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return "That isn't a valid URL.";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "Use an http:// or https:// link.";
  if (url.username || url.password) return "Remove the username and password from the URL.";
  if (PRIVATE_HOST.test(url.hostname)) return "Only public websites can be captured, not local addresses.";
  return null;
}

/** The screenshot service request for `target`. */
export function buildScreenshotRequest(target, { template = DEFAULT_TEMPLATE, apiKey = "" } = {}) {
  let url = template.replace("{url}", encodeURIComponent(target.trim()));
  const headers = { Accept: "image/*" };
  // Microlink's paid plan uses another host and a key header.
  if (apiKey && url.startsWith("https://api.microlink.io/")) {
    url = url.replace("https://api.microlink.io/", "https://pro.microlink.io/");
    headers["x-api-key"] = apiKey;
  }
  return { url, headers };
}

/** Storage path for a new screenshot: screenshots/<folder>/<time>.<ext>. */
export function screenshotPath(folder, contentType, now = Date.now()) {
  const safe = String(folder || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `screenshots/${safe || "misc"}/${now}.${IMAGE_TYPES[contentType] || "png"}`;
}

/**
 * Captures `target` and returns { bytes, contentType }.
 * Throws an Error with a readable message on any failure.
 */
export async function captureScreenshot(target, { template, apiKey, fetchImpl = fetch, timeoutMs = 45000 } = {}) {
  const problem = checkTargetUrl(target);
  if (problem) throw new Error(problem);

  const request = buildScreenshotRequest(target, { template, apiKey });
  let res;
  try {
    res = await fetchImpl(request.url, {
      headers: request.headers,
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
    throw new Error(
      timedOut ? "The screenshot service took too long. Try again in a minute." : `Could not reach the screenshot service: ${err.message}`,
      { cause: err }
    );
  }

  if (res.status === 429) throw new Error("The screenshot service's daily limit is reached. Try again tomorrow, or set SCREENSHOT_API_KEY.");
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.message || body?.error || "";
    } catch {
      // Not JSON.
    }
    throw new Error(`The screenshot service couldn't capture that page (${res.status})${detail ? `: ${detail}` : "."}`);
  }

  const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!IMAGE_TYPES[contentType]) throw new Error("The screenshot service didn't return an image. Check that the page loads publicly.");

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!bytes.length) throw new Error("The screenshot service returned an empty image.");
  if (bytes.length > MAX_SCREENSHOT_BYTES) throw new Error("The screenshot is larger than 8 MB.");
  return { bytes, contentType };
}
