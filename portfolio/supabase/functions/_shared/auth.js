// Admin check shared by the Edge Functions that admins call from the browser.

/**
 * True when the request carries the access token of a user listed in
 * public.admins. `db` is a supabase-js client created with the service role.
 */
export async function isAdminRequest(db, req) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return false;

  const { data: admin } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  return Boolean(admin);
}
