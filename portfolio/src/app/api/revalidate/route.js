import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "../../../lib/publicContent";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "";

/**
 * True when the bearer token belongs to an admin. Uses the admin's own
 * session against Supabase: RLS only returns their row in public.admins.
 */
async function isAdmin(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !SUPABASE_URL || !PUBLIC_KEY) return false;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/admins?select=user_id&limit=1`, {
    headers: { apikey: PUBLIC_KEY, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return false;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length === 1;
}

/** True when the GitHub sync function sends the shared server secret. */
function hasServerSecret(request) {
  const sent = request.headers.get("x-revalidate-secret") || "";
  if (!REVALIDATE_SECRET || sent.length !== REVALIDATE_SECRET.length) return false;
  return timingSafeEqual(Buffer.from(sent), Buffer.from(REVALIDATE_SECRET));
}

/**
 * POST /api/revalidate: refreshes the cached public pages right away.
 * Called by the admin after saving, and by the GitHub sync after it
 * publishes or updates projects.
 */
export async function POST(request) {
  if (!hasServerSecret(request) && !(await isAdmin(request))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  // expire: 0 → the next request fetches fresh content instead of serving stale.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
