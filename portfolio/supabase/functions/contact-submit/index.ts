// Public contact form endpoint.
// Validates input, applies spam checks and per-IP rate limits, stores the
// message with the service role, then emails the owner (when configured).
// Messages are never readable publicly.

import { createClient } from "npm:@supabase/supabase-js@2";
import { hashIp, LIMITS, validateContact } from "../_shared/contact.js";
import { corsHeaders, json, readJson } from "../_shared/http.js";
import { sendNotification } from "../_shared/notify.js";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const SALT = Deno.env.get("IP_HASH_SALT") ?? "local-dev-salt";

// Prefer headers set by the platform's proxy. x-forwarded-for can be supplied
// by the client, so it is only a fallback (the global hourly cap still applies).
function clientIp(req: Request) {
  const direct = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip");
  if (direct) return direct.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { error: "Method not allowed." });

  const body = await readJson(req);
  const check = validateContact(body);

  // Pretend success for bots so they don't learn what tripped the filter.
  if (check.spam) return json(req, 200, { ok: true });
  if (!check.ok) return json(req, 400, { error: "Please fix the highlighted fields.", fields: check.errors });

  const ipHash = await hashIp(clientIp(req), SALT);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [perIp, global] = await Promise.all([
    db.from("contact_messages").select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash).gte("created_at", hourAgo),
    db.from("contact_messages").select("id", { count: "exact", head: true })
      .gte("created_at", hourAgo),
  ]);

  if (perIp.error || global.error) {
    console.error("rate limit query failed", perIp.error ?? global.error);
    return json(req, 500, { error: "Could not send your message. Please try again later." });
  }
  if ((perIp.count ?? 0) >= LIMITS.perIpPerHour || (global.count ?? 0) >= LIMITS.globalPerHour) {
    return json(req, 429, { error: "Too many messages. Please try again in an hour or email me directly." });
  }

  const { error } = await db.from("contact_messages").insert({
    ...check.data,
    ip_hash: ipHash,
    user_agent: (req.headers.get("user-agent") ?? "").slice(0, 400),
  });

  if (error) {
    console.error("insert failed", error);
    return json(req, 500, { error: "Could not send your message. Please try again later." });
  }

  // Email the owner. The message is already saved, so a failed email only logs.
  const notified = await sendNotification(check.data, {
    apiKey: Deno.env.get("RESEND_API_KEY"),
    to: Deno.env.get("NOTIFY_EMAIL"),
    from: Deno.env.get("NOTIFY_FROM"),
  });
  if (!notified.ok && !notified.skipped) console.error("notification email failed:", notified.error);

  return json(req, 201, { ok: true });
});
