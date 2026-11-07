import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

// Only the publishable (anon) key ever reaches the browser. Every write is
// checked by Row Level Security against the signed-in admin.
export const supabase = supabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "portfolio-admin-auth",
      },
    })
  : null;

export const MEDIA_BUCKET = "media";
