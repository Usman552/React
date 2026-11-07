import { supabase } from "./supabase";

/**
 * Tells the Next.js server that public content changed, so visitors see it
 * on their next page load. Sent right away with keepalive, so it still
 * arrives if the admin navigates away straight after saving.
 * Failures are ignored; the site also refreshes on its own every 5 minutes.
 */
export async function refreshPublicSite() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  fetch("/api/revalidate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    keepalive: true,
  }).catch(() => {});
}
