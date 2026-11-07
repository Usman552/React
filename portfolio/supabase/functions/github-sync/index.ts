// GitHub sync endpoint.
//   { action: "sync" }               admin only: refresh repositories, auto-publish/update projects
//   { action: "import", repoIds }    admin only: create draft projects
//   { action: "scheduled" }          pg_cron only (x-cron-secret header)
// The GitHub token stays in Edge Function secrets and never reaches a browser.

import { createClient } from "npm:@supabase/supabase-js@2";
import { isAdminRequest } from "../_shared/auth.js";
import { runImport, runSync } from "../_shared/github.js";
import { corsHeaders, json, readJson, safeEqual } from "../_shared/http.js";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
// Optional: lets the site show auto-published projects immediately.
const SITE_REVALIDATE_URL = Deno.env.get("SITE_REVALIDATE_URL") ?? "";
const REVALIDATE_SECRET = Deno.env.get("REVALIDATE_SECRET") ?? "";

/** Runs a sync and, if projects were published or updated, refreshes the site. */
async function syncAndRefresh() {
  const outcome = await runSync({ db, token: GITHUB_TOKEN });
  const changed = outcome.ok && (outcome.result.auto_published > 0 || outcome.result.auto_updated > 0);
  if (changed && SITE_REVALIDATE_URL && REVALIDATE_SECRET) {
    try {
      const res = await fetch(SITE_REVALIDATE_URL, {
        method: "POST",
        headers: { "x-revalidate-secret": REVALIDATE_SECRET },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) console.error("site revalidate failed:", res.status);
    } catch (err) {
      // The site still refreshes on its own within 5 minutes.
      console.error("site revalidate failed:", err.message);
    }
  }
  return outcome;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { error: "Method not allowed." });

  const body = await readJson(req);
  const action = body?.action;

  if (action === "scheduled") {
    if (!safeEqual(req.headers.get("x-cron-secret") ?? "", CRON_SECRET)) {
      return json(req, 401, { error: "Unauthorized." });
    }
    const { data: config } = await db.from("github_sync").select("enabled, auto_sync").eq("id", 1).single();
    if (!config?.enabled || !config?.auto_sync) return json(req, 200, { ok: true, skipped: true });

    const outcome = await syncAndRefresh();
    return json(req, outcome.ok ? 200 : 502, outcome);
  }

  if (!(await isAdminRequest(db, req))) return json(req, 401, { error: "Unauthorized." });

  if (action === "sync") {
    const outcome = await syncAndRefresh();
    return json(req, outcome.ok ? 200 : 502, outcome);
  }

  if (action === "import") {
    const outcome = await runImport({ db, repoIds: body?.repoIds });
    return json(req, outcome.ok ? 200 : 400, outcome);
  }

  return json(req, 400, { error: "Unknown action." });
});
