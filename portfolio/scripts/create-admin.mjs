// Creates (or promotes) an admin account. Public sign-up is disabled, so
// this is the only way to get into /admin.
//
//   npm run admin:create -- you@example.com
//
// Prompts for a password when the user doesn't exist yet. If the user
// already exists, they are just added to public.admins.

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createAdminClient, fail } from "./lib/adminClient.mjs";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) fail("Usage: npm run admin:create -- you@example.com");

const db = createAdminClient();

async function findUser(address) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail("Could not list users", error);
    const match = data.users.find((u) => u.email?.toLowerCase() === address);
    if (match || data.users.length < 200) return match ?? null;
  }
  return null;
}

async function askPassword() {
  // ADMIN_PASSWORD lets CI or tests run this non-interactively.
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const rl = createInterface({ input: stdin, output: stdout });
  const password = await rl.question("Password for the new admin (min 10 characters): ");
  rl.close();
  return password;
}

let user = await findUser(email);

if (!user) {
  const password = await askPassword();
  if (password.length < 10) fail("Password must be at least 10 characters");

  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) fail("Could not create the user", error);
  user = data.user;
  console.log(`✔ Created user ${email}`);
}

const { error } = await db.from("admins").upsert({ user_id: user.id }, { onConflict: "user_id" });
if (error) fail("Could not grant admin access", error);

console.log(`✔ ${email} is an admin. Sign in at /admin.`);
