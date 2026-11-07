// Content management round-trips: what admins save is what visitors get.

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createUser, publicContent, service, uid, withoutMeta } from "./helpers.mjs";

let admin;
let profileBefore;
let settingsBefore;
const created = { projects: [], services: [], skill_categories: [] };

before(async () => {
  admin = await createUser({ admin: true });
  profileBefore = (await service.from("profile").select("*").eq("id", 1).single()).data;
  settingsBefore = (await service.from("site_settings").select("*").eq("id", 1).single()).data;
});

after(async () => {
  // Put the singleton rows back exactly as they were.
  await service.from("profile").update(withoutMeta(profileBefore)).eq("id", 1);
  await service.from("site_settings").update(withoutMeta(settingsBefore)).eq("id", 1);
  for (const [table, ids] of Object.entries(created)) {
    if (ids.length) await service.from(table).delete().in("id", ids);
  }
  await admin.cleanup();
});

describe("profile and settings", () => {
  it("profile edits persist and reach the public site", async () => {
    const heading = `Test heading ${uid()}`;
    const { error } = await admin.client.from("profile").update({ hero_heading: heading }).eq("id", 1);
    assert.equal(error, null);

    const { data: reread } = await admin.client.from("profile").select("hero_heading").eq("id", 1).single();
    assert.equal(reread.hero_heading, heading);
    assert.equal((await publicContent()).profile.hero_heading, heading);
  });

  it("settings persist, including section visibility", async () => {
    const sections = { ...settingsBefore.sections, services: { ...settingsBefore.sections.services, visible: false } };
    const { error } = await admin.client.from("site_settings").update({ sections, footer_note: "Test note" }).eq("id", 1);
    assert.equal(error, null);

    const { settings } = await publicContent();
    assert.equal(settings.footer_note, "Test note");
    assert.equal(settings.sections.services.visible, false);
  });
});

describe("projects", () => {
  it("create → publish → unpublish controls public visibility", async () => {
    const slug = uid("proj");
    const { data: project, error } = await admin.client
      .from("projects")
      .insert({ slug, title: "Integration project", status: "draft", tech: ["React"] })
      .select()
      .single();
    assert.equal(error, null);
    created.projects.push(project.id);

    const isPublic = async () => (await publicContent()).projects.some((p) => p.id === project.id);
    assert.equal(await isPublic(), false, "drafts are hidden");

    const { data: published } = await admin.client
      .from("projects")
      .update({ status: "published", title: "Edited title" })
      .eq("id", project.id)
      .select()
      .single();
    assert.ok(published.published_at, "published_at is stamped");
    assert.equal(await isPublic(), true);
    assert.equal((await publicContent()).projects.find((p) => p.id === project.id).title, "Edited title");

    await admin.client.from("projects").update({ status: "draft" }).eq("id", project.id);
    assert.equal(await isPublic(), false, "unpublished projects disappear");
  });

  it("rejects duplicate slugs", async () => {
    const slug = uid("dup");
    const first = await admin.client.from("projects").insert({ slug, title: "One" }).select().single();
    created.projects.push(first.data.id);
    const second = await admin.client.from("projects").insert({ slug, title: "Two" });
    assert.equal(second.error?.code, "23505");
  });
});

describe("services and skills", () => {
  it("hidden services are not public", async () => {
    const { data: service_ } = await admin.client
      .from("services")
      .insert({ title: `Service ${uid()}`, published: true })
      .select()
      .single();
    created.services.push(service_.id);
    assert.ok((await publicContent()).services.some((s) => s.id === service_.id));

    await admin.client.from("services").update({ published: false }).eq("id", service_.id);
    assert.ok(!(await publicContent()).services.some((s) => s.id === service_.id));
  });

  it("skills appear under their category, without a level when none is set", async () => {
    const { data: category } = await admin.client
      .from("skill_categories")
      .insert({ title: `Category ${uid()}`, accent: "mint" })
      .select()
      .single();
    created.skill_categories.push(category.id);

    // Bulk inserts need the same keys on every row (PostgREST fills gaps with null).
    const { error } = await admin.client.from("skills").insert([
      { category_id: category.id, name: "With level", level: 70, published: true, sort_order: 10 },
      { category_id: category.id, name: "No level", level: null, published: true, sort_order: 20 },
      { category_id: category.id, name: "Hidden", level: 50, published: false, sort_order: 30 },
    ]);
    assert.equal(error, null);

    const group = (await publicContent()).skill_categories.find((c) => c.id === category.id);
    assert.deepEqual(
      group.skills.map((s) => [s.name, s.level]),
      [
        ["With level", 70],
        ["No level", null],
      ]
    );

    await admin.client.from("skill_categories").update({ published: false }).eq("id", category.id);
    assert.ok(!(await publicContent()).skill_categories.some((c) => c.id === category.id));
  });
});
