import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalTech, coveredKeys, discoverSkills, matchCategory } from "../../supabase/functions/_shared/skills.js";
import { captureScreenshot, checkTargetUrl, screenshotPath } from "../../supabase/functions/_shared/screenshot.js";
import { normalizeTheme } from "../../src/lib/publicContent.js";
import { visibleSections } from "../../src/lib/sections.js";
import { validateExperience } from "../../src/admin/lib/validation.js";

function repo(overrides = {}) {
  return {
    id: 1,
    name: "demo",
    state: "active",
    language: null,
    languages: {},
    topics: [],
    readme_tech: [],
    readme_topics: [],
    ...overrides,
  };
}

describe("canonicalTech", () => {
  it("collapses versions, aliases and trailing words", () => {
    assert.equal(canonicalTech("React 19").name, "React");
    assert.equal(canonicalTech("react").name, "React");
    assert.equal(canonicalTech("Next.js 16").name, "Next.js");
    assert.equal(canonicalTech("Tailwind CSS 4").name, "Tailwind CSS");
    assert.equal(canonicalTech("Laravel session auth").name, "Laravel");
    assert.equal(canonicalTech("PHP 8.2+").name, "PHP");
    assert.equal(canonicalTech("@react-three/drei").name, "React Three Fiber");
  });

  it("ignores phrases that are not technologies", () => {
    assert.equal(canonicalTech("Unsplash photos"), null);
    assert.equal(canonicalTech("Poly Haven"), null);
    assert.equal(canonicalTech(""), null);
    assert.equal(canonicalTech(null), null);
  });
});

describe("coveredKeys", () => {
  it("lets one combined skill cover several technologies", () => {
    const keys = coveredKeys("HTML5 & CSS3");
    assert.ok(keys.has("html") && keys.has("css"));
    assert.ok(coveredKeys("Tailwind & Bootstrap").has("bootstrap"));
    assert.ok(coveredKeys("Git & GitHub").has("github"));
  });
});

describe("discoverSkills", () => {
  it("counts each technology once per repository, most used first", () => {
    const found = discoverSkills({
      repos: [
        repo({ id: 1, readme_tech: ["GSAP 3.12.5", "GSAP", "ScrollTrigger"] }),
        repo({ id: 2, name: "two", readme_tech: ["GSAP 3"] }),
        repo({ id: 3, name: "three", readme_tech: ["Lenis"] }),
      ],
    });
    assert.deepEqual(
      found.map((s) => [s.name, s.count]),
      [["GSAP", 2], ["Lenis", 1]]
    );
    assert.deepEqual(found[0].repos, ["demo", "two"]);
  });

  it("hides technologies already covered or dismissed", () => {
    const repos = [repo({ readme_tech: ["React", "CSS", "GSAP", "Vite"] })];
    const found = discoverSkills({
      repos,
      skills: [{ name: "React" }, { name: "HTML5 & CSS3" }],
      dismissed: [{ key: "vite" }],
    });
    assert.deepEqual(found.map((s) => s.name), ["GSAP"]);
  });

  it("skips missing repositories and tiny language shares", () => {
    const found = discoverSkills({
      repos: [
        repo({ id: 1, state: "missing", readme_tech: ["Docker"] }),
        repo({ id: 2, languages: { TypeScript: 9900, Shell: 100 } }),
      ],
    });
    assert.deepEqual(found.map((s) => s.name), ["TypeScript"]);
  });

  it("reads topics too", () => {
    const found = discoverSkills({ repos: [repo({ topics: ["nextjs", "supabase", "hackathon"] })] });
    assert.deepEqual(found.map((s) => s.name).sort(), ["Next.js", "Supabase"]);
  });
});

describe("matchCategory", () => {
  const categories = [{ title: "Frontend Engineering" }, { title: "Backend & Data" }, { title: "Tooling & Workflow" }];

  it("finds the existing category for a group", () => {
    assert.equal(matchCategory("frontend", categories).title, "Frontend Engineering");
    assert.equal(matchCategory("backend", categories).title, "Backend & Data");
    assert.equal(matchCategory("tools", categories).title, "Tooling & Workflow");
  });

  it("returns null when the group has no category yet", () => {
    assert.equal(matchCategory("devops", categories), null);
    assert.equal(matchCategory("unknown", categories), null);
  });
});

describe("screenshot helpers", () => {
  it("rejects URLs that can't be captured", () => {
    assert.equal(checkTargetUrl("https://example.com/page"), null);
    assert.ok(checkTargetUrl("ftp://example.com"));
    assert.ok(checkTargetUrl("http://localhost:3000"));
    assert.ok(checkTargetUrl("http://192.168.1.5"));
    assert.ok(checkTargetUrl("https://user:pass@example.com"));
    assert.ok(checkTargetUrl("not a url"));
    assert.ok(checkTargetUrl(""));
  });

  it("builds safe storage paths", () => {
    assert.equal(screenshotPath("projects/ABC 123", "image/png", 5), "screenshots/projects-abc-123/5.png");
    assert.equal(screenshotPath("", "image/webp", 5), "screenshots/misc/5.webp");
  });

  it("returns the image the service sends", async () => {
    const fetchImpl = async (url) => {
      assert.ok(url.includes(encodeURIComponent("https://example.com")));
      return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } });
    };
    const shot = await captureScreenshot("https://example.com", { fetchImpl });
    assert.equal(shot.contentType, "image/png");
    assert.equal(shot.bytes.length, 3);
  });

  it("explains service failures", async () => {
    const limited = async () => new Response("", { status: 429 });
    await assert.rejects(captureScreenshot("https://example.com", { fetchImpl: limited }), /limit/);

    const html = async () => new Response("<html>", { headers: { "content-type": "text/html" } });
    await assert.rejects(captureScreenshot("https://example.com", { fetchImpl: html }), /didn't return an image/);

    await assert.rejects(captureScreenshot("http://localhost", { fetchImpl: html }), /public websites/);
  });
});

describe("normalizeTheme", () => {
  it("falls back to defaults for missing or invalid values", () => {
    assert.deepEqual(normalizeTheme(undefined), { mode: "system", allow_toggle: true, accent: "aurora" });
    assert.deepEqual(normalizeTheme({ mode: "neon", accent: "plaid" }), { mode: "system", allow_toggle: true, accent: "aurora" });
  });

  it("keeps valid choices", () => {
    assert.deepEqual(normalizeTheme({ mode: "light", allow_toggle: false, accent: "ocean" }), {
      mode: "light",
      allow_toggle: false,
      accent: "ocean",
    });
  });
});

describe("visibleSections", () => {
  const base = {
    settings: { sections: {} },
    services: [{}],
    skill_categories: [{}],
    experience: [{}],
  };
  const ids = (content) => visibleSections(content).map((s) => s.id);

  it("shows everything that has content, work first", () => {
    assert.deepEqual(ids(base), ["projects", "services", "about", "experience", "skills", "contact"]);
  });

  it("hides empty experience, services and skills", () => {
    assert.deepEqual(ids({ ...base, experience: [], services: [], skill_categories: [] }), ["projects", "about", "contact"]);
    assert.ok(!ids({ ...base, experience: undefined }).includes("experience"));
  });

  it("respects sections switched off in settings", () => {
    const settings = { sections: { about: { visible: false } } };
    assert.ok(!ids({ ...base, settings }).includes("about"));
  });
});

describe("validateExperience", () => {
  it("requires a title and bounds the dates", () => {
    assert.ok(validateExperience({ title: "", start_date: "", end_date: "" }).title);
    assert.ok(validateExperience({ title: "Dev", start_date: "2024-05-01", end_date: "2024-01-01" }).end_date);
    assert.deepEqual(validateExperience({ title: "Dev", start_date: "2024-01-01", end_date: "2024-05-01" }), {});
  });

  it("ignores the end date while the role is current", () => {
    assert.deepEqual(
      validateExperience({ title: "Dev", start_date: "2024-05-01", end_date: "2024-01-01", is_current: true }),
      {}
    );
  });

  it("rejects unsafe links", () => {
    assert.ok(validateExperience({ title: "Dev", url: "javascript:alert(1)" }).url);
  });
});
