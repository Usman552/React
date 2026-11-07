// The contact-submit Edge Function: validation, storage, privacy, rate limits.

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { anon, callFunction, createUser, service, TEST_DOMAIN, uid } from "./helpers.mjs";

let admin;

const message = (overrides = {}) => ({
  name: "Integration Test",
  email: `${uid("lead")}@${TEST_DOMAIN}`,
  message: "Hello, this is an automated integration test.",
  startedAt: Date.now() - 10_000,
  ...overrides,
});

async function clearTestMessages() {
  await service.from("contact_messages").delete().like("email", `%@${TEST_DOMAIN}`);
}

before(async () => {
  admin = await createUser({ admin: true });
  await clearTestMessages();
});

after(async () => {
  await clearTestMessages();
  await admin.cleanup();
});

describe("contact-submit", () => {
  it("rejects invalid input with field errors", async () => {
    const res = await callFunction("contact-submit", message({ email: "nope", message: "hi" }));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.fields.email);
    assert.ok(body.fields.message);
  });

  it("stores valid messages, readable only by admins", async () => {
    const payload = message();
    const res = await callFunction("contact-submit", payload);
    assert.equal(res.status, 201);

    const { data: asAdmin } = await admin.client.from("contact_messages").select("*").eq("email", payload.email);
    assert.equal(asAdmin.length, 1);
    assert.equal(asAdmin[0].status, "unread");
    assert.match(asAdmin[0].ip_hash, /^[0-9a-f]{64}$/, "IP is stored only as a hash");

    const { data: asAnon, error } = await anon.from("contact_messages").select("*").eq("email", payload.email);
    assert.ok(error || asAnon.length === 0);
  });

  it("silently drops honeypot submissions", async () => {
    const payload = message({ company: "Spam Inc" });
    const res = await callFunction("contact-submit", payload);
    assert.equal(res.status, 200);
    const { data } = await service.from("contact_messages").select("id").eq("email", payload.email);
    assert.equal(data.length, 0);
  });

  it("rate-limits repeated submissions from one client", async () => {
    const statuses = [];
    for (let i = 0; i < 5; i += 1) {
      statuses.push((await callFunction("contact-submit", message())).status);
    }
    assert.ok(statuses.includes(429), `expected a 429, got ${statuses.join(",")}`);
    assert.ok(statuses.filter((s) => s === 201).length <= 3);
  });

  it("lets admins update status", async () => {
    const { data } = await admin.client.from("contact_messages").select("id").like("email", `%@${TEST_DOMAIN}`).limit(1);
    const { data: updated, error } = await admin.client
      .from("contact_messages")
      .update({ status: "contacted", contacted_at: new Date().toISOString() })
      .eq("id", data[0].id)
      .select()
      .single();
    assert.equal(error, null);
    assert.equal(updated.status, "contacted");
  });
});
