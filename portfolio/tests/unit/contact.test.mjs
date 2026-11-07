import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashIp, LIMITS, validateContact } from "../../supabase/functions/_shared/contact.js";

const NOW = 1_800_000_000_000;
const valid = { name: "Ali", email: "Ali@Example.com", message: "I would like a website.", startedAt: NOW - 10_000 };

describe("validateContact", () => {
  it("accepts and normalises a valid message", () => {
    const result = validateContact(valid, NOW);
    assert.equal(result.ok, true);
    assert.deepEqual(result.data, { name: "Ali", email: "ali@example.com", message: "I would like a website." });
  });

  it("returns field errors", () => {
    const result = validateContact({ name: "", email: "nope", message: "short" }, NOW);
    assert.equal(result.ok, false);
    assert.deepEqual(Object.keys(result.errors).sort(), ["email", "message", "name"]);
  });

  it("enforces length limits", () => {
    const result = validateContact({ ...valid, message: "x".repeat(LIMITS.message + 1) }, NOW);
    assert.match(result.errors.message, /under/);
  });

  it("treats a filled honeypot as spam", () => {
    assert.equal(validateContact({ ...valid, company: "ACME" }, NOW).spam, true);
  });

  it("treats impossibly fast submissions as spam", () => {
    assert.equal(validateContact({ ...valid, startedAt: NOW - 500 }, NOW).spam, true);
  });

  it("strips NUL bytes and rejects non-objects", () => {
    assert.equal(validateContact({ ...valid, name: "A\0li" }, NOW).data.name, "Ali");
    assert.equal(validateContact(null, NOW).ok, false);
    assert.equal(validateContact("text", NOW).ok, false);
  });
});

describe("hashIp", () => {
  it("is stable per salt and never returns the IP", async () => {
    const a = await hashIp("203.0.113.5", "salt");
    assert.equal(a, await hashIp("203.0.113.5", "salt"));
    assert.notEqual(a, await hashIp("203.0.113.5", "other"));
    assert.match(a, /^[0-9a-f]{64}$/);
  });
});
