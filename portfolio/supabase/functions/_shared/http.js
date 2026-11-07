// Small HTTP helpers shared by the Edge Functions.

function allowedOrigins() {
  const raw = globalThis.Deno?.env.get("ALLOWED_ORIGINS") ?? "";
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

export function corsHeaders(req) {
  const origin = req.headers.get("origin") ?? "";
  const list = allowedOrigins();
  // With no allow-list configured (local dev) any origin may call the function.
  const allow = list.length === 0 ? "*" : list.includes(origin) ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-cron-secret",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function json(req, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/** Constant-time string comparison for shared secrets. */
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length || !a.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function readJson(req, maxBytes = 20_000) {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
