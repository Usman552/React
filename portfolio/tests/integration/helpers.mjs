// Shared setup for integration tests against the local Supabase stack
// (`npm run db:start`). Each run creates throwaway users and removes them.

import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!URL || !PUBLIC_KEY || !SECRET_KEY) {
  throw new Error("Integration tests need .env.local and .env.scripts.local (see README).");
}

export const FUNCTIONS_URL = `${URL}/functions/v1`;
export const TEST_DOMAIN = "tests.portfolio.local";

const options = { auth: { persistSession: false, autoRefreshToken: false } };

export const service = createClient(URL, SECRET_KEY, options);
export const anon = createClient(URL, PUBLIC_KEY, options);

export function uid(prefix = "t") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Creates a user, optionally an admin, and returns a signed-in client. */
export async function createUser({ admin }) {
  const email = `${uid(admin ? "admin" : "user")}@${TEST_DOMAIN}`;
  const password = `Pw-${uid()}`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  if (admin) {
    const { error: grantError } = await service.from("admins").insert({ user_id: data.user.id });
    if (grantError) throw grantError;
  }

  const client = createClient(URL, PUBLIC_KEY, options);
  const { data: session, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return {
    client,
    user: data.user,
    token: session.session.access_token,
    cleanup: () => service.auth.admin.deleteUser(data.user.id),
  };
}

export async function publicContent() {
  const { data, error } = await anon.rpc("get_public_content");
  if (error) throw error;
  return data;
}

export function callFunction(name, body, { token, headers = {} } = {}) {
  return fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      apikey: PUBLIC_KEY,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

/** A singleton row without its server-managed columns, ready to write back. */
export function withoutMeta(row) {
  const copy = { ...row };
  delete copy.id;
  delete copy.updated_at;
  return copy;
}
