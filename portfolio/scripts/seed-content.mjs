// Copies the built-in content (src/data/defaults.js) into an empty database.
//
//   npm run db:seed            seed only what is still empty
//   npm run db:seed -- --force also overwrite profile + site settings
//
// Safe to run repeatedly: without --force nothing that already has content
// is touched, so it never overwrites edits made in the admin.

import {
  defaultProfile,
  defaultProjects,
  defaultServices,
  defaultSettings,
  defaultSkillCategories,
} from "../src/data/defaults.js";
import { createAdminClient, fail } from "./lib/adminClient.mjs";

const force = process.argv.includes("--force");
const db = createAdminClient();

async function isEmpty(table) {
  const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
  if (error) fail(`Could not read ${table}`, error);
  return count === 0;
}

async function seedSingleton(table, values, isBlank) {
  const { data, error } = await db.from(table).select("*").eq("id", 1).single();
  if (error) fail(`Could not read ${table}`, error);
  if (!force && !isBlank(data)) return console.log(`• ${table}: already has content, skipped`);

  const { error: updateError } = await db.from(table).update(values).eq("id", 1);
  if (updateError) fail(`Could not seed ${table}`, updateError);
  console.log(`✔ ${table}: seeded`);
}

async function seedList(table, rows) {
  if (!(await isEmpty(table))) return console.log(`• ${table}: already has rows, skipped`);
  const { data, error } = await db.from(table).insert(rows).select();
  if (error) fail(`Could not seed ${table}`, error);
  console.log(`✔ ${table}: ${data.length} rows`);
  return data;
}

await seedSingleton("profile", defaultProfile, (row) => !row.name);
await seedSingleton("site_settings", defaultSettings, (row) => !row.site_title);

await seedList(
  "projects",
  defaultProjects.map((p, i) => ({ ...p, status: "published", source: "manual", sort_order: (i + 1) * 10 }))
);

await seedList(
  "services",
  defaultServices.map((s, i) => ({ ...s, published: true, sort_order: (i + 1) * 10 }))
);

if (await isEmpty("skill_categories")) {
  for (const [i, { skills, ...category }] of defaultSkillCategories.entries()) {
    const { data, error } = await db
      .from("skill_categories")
      .insert({ ...category, published: true, sort_order: (i + 1) * 10 })
      .select()
      .single();
    if (error) fail("Could not seed skill_categories", error);

    const { error: skillsError } = await db
      .from("skills")
      .insert(skills.map((s, j) => ({ ...s, category_id: data.id, published: true, sort_order: (j + 1) * 10 })));
    if (skillsError) fail("Could not seed skills", skillsError);
  }
  console.log(`✔ skill_categories: ${defaultSkillCategories.length} categories with skills`);
} else {
  console.log("• skill_categories: already has rows, skipped");
}

console.log("\nDone.");
