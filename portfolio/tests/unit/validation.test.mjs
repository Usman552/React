import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSafeUrl,
  slugify,
  validateProfile,
  validateProject,
  validateSkill,
} from "../../src/admin/lib/validation.js";

const project = {
  title: "My App",
  slug: "my-app",
  summary: "",
  details: "",
  category: "React",
  demo_url: "",
  repo_url: "https://github.com/me/app",
  thumbnail_url: null,
};

describe("admin validation", () => {
  it("accepts a valid project", () => {
    assert.deepEqual(validateProject(project), {});
  });

  it("rejects bad slugs and unsafe links", () => {
    const errors = validateProject({ ...project, slug: "My App", demo_url: "javascript:alert(1)" });
    assert.ok(errors.slug);
    assert.ok(errors.demo_url);
  });

  it("requires a title", () => {
    assert.ok(validateProject({ ...project, title: "  " }).title);
  });

  it("treats skill level as optional but bounded", () => {
    assert.deepEqual(validateSkill({ name: "React", level: "" }), {});
    assert.deepEqual(validateSkill({ name: "React", level: 90 }), {});
    assert.ok(validateSkill({ name: "React", level: 101 }).level);
    assert.ok(validateSkill({ name: "React", level: 5.5 }).level);
  });

  it("validates profile social links and email", () => {
    const errors = validateProfile({
      name: "Usman",
      hero_heading: "Hi",
      email: "not-an-email",
      socials: [{ label: "", url: "ftp://x" }],
      cta_primary: { label: "Go", href: "javascript:void(0)" },
    });
    assert.ok(errors.email);
    assert.ok(errors["socials.0.label"]);
    assert.ok(errors["socials.0.url"]);
    assert.ok(errors["cta_primary.href"]);
  });

  it("matches the database URL rule", () => {
    assert.equal(isSafeUrl("/shots/app.png"), true);
    assert.equal(isSafeUrl("//evil.com"), false);
    assert.equal(slugify("Z&S Perfumes"), "z-s-perfumes");
  });
});
