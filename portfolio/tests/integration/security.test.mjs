// Row Level Security and authorization: what anonymous visitors, signed-in
// non-admins and admins can and cannot do.

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { anon, createUser, publicContent, service, uid } from "./helpers.mjs";

let admin;
let stranger;
let draftId;

before(async () => {
  admin = await createUser({ admin: true });
  stranger = await createUser({ admin: false });
  const { data, error } = await service
    .from("projects")
    .insert({ slug: uid("draft"), title: "Secret draft", status: "draft" })
    .select()
    .single();
  if (error) throw error;
  draftId = data.id;
});

after(async () => {
  await service.from("projects").delete().eq("id", draftId);
  await admin.cleanup();
  await stranger.cleanup();
});

describe("anonymous visitors", () => {
  it("cannot see draft projects, directly or via the public RPC", async () => {
    const { data } = await anon.from("projects").select("id").eq("id", draftId);
    assert.deepEqual(data, []);
    const content = await publicContent();
    assert.ok(!content.projects.some((p) => p.id === draftId));
  });

  it("cannot read messages, repositories or sync settings", async () => {
    for (const table of ["contact_messages", "github_repos", "github_sync"]) {
      const { data, error } = await anon.from(table).select("*");
      assert.ok(error || data.length === 0, `${table} should not be readable`);
    }
  });

  it("cannot change content", async () => {
    const { data: profile } = await anon.from("profile").update({ name: "Hacked" }).eq("id", 1).select();
    assert.deepEqual(profile ?? [], []);

    const { error: insertError } = await anon.from("projects").insert({ slug: uid("x"), title: "x" });
    assert.ok(insertError);

    const { data: removed } = await anon.from("services").delete().neq("id", "00000000-0000-0000-0000-000000000000").select();
    assert.deepEqual(removed ?? [], []);
  });

  it("cannot call the admin overview", async () => {
    const { error } = await anon.rpc("get_admin_overview");
    assert.ok(error);
  });

  it("cannot sign up", async () => {
    const { error } = await anon.auth.signUp({ email: `${uid()}@example.com`, password: "Password#123456" });
    assert.ok(error);
  });

  it("cannot upload media", async () => {
    const { error } = await anon.storage
      .from("media")
      .upload(`tests/${uid()}.png`, new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }), {
        contentType: "image/png",
      });
    assert.ok(error);
  });
});

describe("signed-in non-admins", () => {
  it("cannot read drafts, messages or write content", async () => {
    const { data: drafts } = await stranger.client.from("projects").select("id").eq("id", draftId);
    assert.deepEqual(drafts, []);

    const { data: messages } = await stranger.client.from("contact_messages").select("id");
    assert.deepEqual(messages ?? [], []);

    const { data: updated } = await stranger.client.from("profile").update({ name: "Hacked" }).eq("id", 1).select();
    assert.deepEqual(updated ?? [], []);

    const { error } = await stranger.client.from("admins").insert({ user_id: stranger.user.id });
    assert.ok(error, "users must not be able to promote themselves");
  });
});

describe("admins", () => {
  it("can see drafts and the overview", async () => {
    const { data } = await admin.client.from("projects").select("id").eq("id", draftId);
    assert.equal(data.length, 1);
    const { data: overview, error } = await admin.client.rpc("get_admin_overview");
    assert.equal(error, null);
    assert.ok(overview.projects_draft >= 1);
  });

  it("are still bound by database constraints", async () => {
    const { error } = await admin.client
      .from("projects")
      .update({ demo_url: "javascript:alert(1)" })
      .eq("id", draftId);
    assert.equal(error?.code, "23514");
  });

  it("can upload images but not SVG or other types", async () => {
    const path = `tests/${uid()}.png`;
    const png = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" });
    const { error } = await admin.client.storage.from("media").upload(path, png, { contentType: "image/png" });
    assert.equal(error, null);
    await service.storage.from("media").remove([path]);

    const svg = new Blob(["<svg onload=alert(1)></svg>"], { type: "image/svg+xml" });
    const { error: svgError } = await admin.client.storage
      .from("media")
      .upload(`tests/${uid()}.svg`, svg, { contentType: "image/svg+xml" });
    assert.ok(svgError, "SVG uploads must be rejected");
  });
});
