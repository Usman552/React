import { createClient } from "@supabase/supabase-js";

/** Service-role client for one-off scripts. Never import this from src/. */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY.\n" +
        "Copy .env.scripts.example to .env.scripts.local and fill it in (see README)."
    );
    process.exit(1);
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function fail(message, error) {
  console.error(`✖ ${message}${error ? `: ${error.message}` : ""}`);
  process.exit(1);
}
