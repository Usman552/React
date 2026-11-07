// Captures a website screenshot and stores it in the media bucket.
//   { url, folder? }   admin only → { path }
// The browser turns the path into a public URL with its own Supabase client,
// because the URL this function sees for Storage is internal in local dev.

import { createClient } from "npm:@supabase/supabase-js@2";
import { isAdminRequest } from "../_shared/auth.js";
import { corsHeaders, json, readJson } from "../_shared/http.js";
import { captureScreenshot, checkTargetUrl, screenshotPath } from "../_shared/screenshot.js";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const TEMPLATE = Deno.env.get("SCREENSHOT_URL_TEMPLATE") || undefined;
const API_KEY = Deno.env.get("SCREENSHOT_API_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { error: "Method not allowed." });
  if (!(await isAdminRequest(db, req))) return json(req, 401, { error: "Unauthorized." });

  const body = await readJson(req);
  const target = typeof body?.url === "string" ? body.url.trim() : "";
  const problem = checkTargetUrl(target);
  if (problem) return json(req, 400, { error: problem });

  let shot;
  try {
    shot = await captureScreenshot(target, { template: TEMPLATE, apiKey: API_KEY });
  } catch (err) {
    return json(req, 502, { error: err.message });
  }

  const path = screenshotPath(body?.folder, shot.contentType);
  const { error } = await db.storage.from("media").upload(path, shot.bytes, {
    contentType: shot.contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return json(req, 500, { error: `Could not save the screenshot: ${error.message}` });

  return json(req, 200, { path });
});
