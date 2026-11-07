import { refreshPublicSite } from "./revalidate";
import { supabase } from "./supabase";

// Tables the public site reads; writing to them refreshes the live pages.
const PUBLIC_TABLES = new Set(["profile", "site_settings", "projects", "services", "skill_categories", "skills", "experience"]);

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

/** Runs a write and, if it touched public content, refreshes the site. */
async function write(table, request) {
  const data = unwrap(await request);
  if (PUBLIC_TABLES.has(table)) refreshPublicSite();
  return data;
}

export const api = {
  overview: async () => unwrap(await supabase.rpc("get_admin_overview")),

  getProfile: async () => unwrap(await supabase.from("profile").select("*").eq("id", 1).single()),
  saveProfile: (values) => write("profile", supabase.from("profile").update(values).eq("id", 1).select().single()),

  getSettings: async () => unwrap(await supabase.from("site_settings").select("*").eq("id", 1).single()),
  saveSettings: (values) =>
    write("site_settings", supabase.from("site_settings").update(values).eq("id", 1).select().single()),

  list: async (table, order = "sort_order") =>
    unwrap(await supabase.from(table).select("*").order(order).order("created_at")),
  get: async (table, id) => unwrap(await supabase.from(table).select("*").eq("id", id).single()),
  insert: (table, values) => write(table, supabase.from(table).insert(values).select().single()),
  update: (table, id, values) => write(table, supabase.from(table).update(values).eq("id", id).select().single()),
  remove: (table, id) => write(table, supabase.from(table).delete().eq("id", id)),

  /** Renumbers sort_order (10, 20, 30…) and saves only the rows that changed. */
  reorder: async (table, items) => {
    const changed = items
      .map((item, i) => ({ id: item.id, sort_order: (i + 1) * 10, before: item.sort_order }))
      .filter((row) => row.sort_order !== row.before);
    const results = await Promise.all(
      changed.map((row) => supabase.from(table).update({ sort_order: row.sort_order }).eq("id", row.id))
    );
    const failed = results.find((r) => r.error);
    if (failed) throw failed.error;
    if (PUBLIC_TABLES.has(table)) refreshPublicSite();
    return items.map((item, i) => ({ ...item, sort_order: (i + 1) * 10 }));
  },
};

export function nextSortOrder(items) {
  return items.reduce((max, item) => Math.max(max, item.sort_order ?? 0), 0) + 10;
}

/** Moves items[index] by `delta` (-1 up, +1 down) and returns a new array. */
export function moveInList(items, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
