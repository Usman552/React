// Contact form validation. Plain JS so it runs in Deno (Edge Functions) and
// in Node (tests) without changes.

export const LIMITS = {
  name: 100,
  email: 254,
  message: 5000,
  minMessage: 10,
  // A human needs at least this long to fill the form.
  minFillMs: 2500,
  perIpPerHour: 3,
  globalPerHour: 60,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value) {
  // Postgres text can't hold NUL bytes, so strip them before validating.
  return typeof value === "string" ? value.replaceAll("\0", "").trim() : "";
}

/**
 * Validates a raw request body.
 * Returns { ok: true, data } or { ok: false, errors, spam }.
 * `spam: true` means the request should be silently accepted and dropped.
 */
export function validateContact(body, now = Date.now()) {
  if (!body || typeof body !== "object") {
    return { ok: false, errors: { form: "Invalid request." } };
  }

  // Honeypot: real visitors never see or fill this field.
  if (clean(body.company)) return { ok: false, spam: true, errors: {} };

  const startedAt = Number(body.startedAt);
  if (Number.isFinite(startedAt) && startedAt > 0 && now - startedAt < LIMITS.minFillMs) {
    return { ok: false, spam: true, errors: {} };
  }

  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const message = clean(body.message);
  const errors = {};

  if (!name) errors.name = "Please enter your name.";
  else if (name.length > LIMITS.name) errors.name = `Name must be under ${LIMITS.name} characters.`;

  if (!email) errors.email = "Please enter your email.";
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";

  if (!message) errors.message = "Please write a message.";
  else if (message.length < LIMITS.minMessage) errors.message = `Message must be at least ${LIMITS.minMessage} characters.`;
  else if (message.length > LIMITS.message) errors.message = `Message must be under ${LIMITS.message} characters.`;

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, email, message } };
}

/** SHA-256 of ip + salt, hex encoded. The raw IP is never stored. */
export async function hashIp(ip, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
