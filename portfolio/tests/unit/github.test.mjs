import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contentFromRepo,
  fetchUserRepos,
  GithubError,
  guessCategory,
  humanizeRepoName,
  mainLanguages,
  missingForAutoPublish,
  normalizeRepo,
  planSync,
  repoToProject,
  slugify,
  uniqueSlug,
} from "../../supabase/functions/_shared/github.js";

const NOW = "2026-10-30T10:00:00.000Z";

function apiRepo(id, overrides = {}) {
  return {
    id,
    name: `repo-${id}`,
    full_name: `me/repo-${id}`,
    description: `Repo ${id}`,
    html_url: `https://github.com/me/repo-${id}`,
    homepage: "",
    language: "JavaScript",
    topics: [],
    stargazers_count: 1,
    forks_count: 0,
    fork: false,
    archived: false,
    pushed_at: NOW,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

describe("fetchUserRepos", () => {
  it("follows pagination until a short page", async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(url);
      const page = Number(new URL(url).searchParams.get("page"));
      const size = page === 1 ? 100 : 7;
      return jsonResponse(Array.from({ length: size }, (_, i) => apiRepo(page * 1000 + i)));
    };
    const repos = await fetchUserRepos({ username: "me", fetchImpl });
    assert.equal(repos.length, 107);
    assert.equal(calls.length, 2);
    assert.match(calls[0], /\/users\/me\/repos\?type=owner/);
  });

  it("sends the token only when one is configured", async () => {
    let seen;
    const fetchImpl = async (_url, init) => {
      seen = init.headers;
      return jsonResponse([]);
    };
    await fetchUserRepos({ username: "me", fetchImpl });
    assert.equal(seen.Authorization, undefined);
    await fetchUserRepos({ username: "me", token: "abc", fetchImpl });
    assert.equal(seen.Authorization, "Bearer abc");
  });

  it("explains 404 and rate-limit failures", async () => {
    await assert.rejects(
      fetchUserRepos({ username: "ghost", fetchImpl: async () => jsonResponse({}, 404) }),
      (err) => err instanceof GithubError && /not found/.test(err.message)
    );
    await assert.rejects(
      fetchUserRepos({
        username: "me",
        fetchImpl: async () =>
          jsonResponse({}, 403, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1893456000" }),
      }),
      /rate limit/
    );
  });

  it("wraps network errors", async () => {
    await assert.rejects(
      fetchUserRepos({ username: "me", fetchImpl: async () => Promise.reject(new Error("offline")) }),
      /Could not reach GitHub: offline/
    );
  });
});

describe("planSync", () => {
  it("counts new vs updated and keys by the stable id", () => {
    const plan = planSync({
      fetched: [apiRepo(1), apiRepo(2, { name: "renamed" })],
      stored: [{ id: 2, state: "active" }],
      includeForks: false,
      nowIso: NOW,
    });
    assert.deepEqual(plan.stats, { fetched: 2, skipped_forks: 0, new: 1, updated: 1, missing: 0 });
    assert.equal(plan.upserts.find((r) => r.id === 2).name, "renamed");
  });

  it("flags repos that disappeared without deleting anything", () => {
    const plan = planSync({
      fetched: [apiRepo(1)],
      stored: [
        { id: 1, state: "active" },
        { id: 2, state: "active" },
        { id: 3, state: "missing" },
      ],
      includeForks: false,
      nowIso: NOW,
    });
    assert.deepEqual(plan.missing, [2]);
  });

  it("skips forks unless enabled, but does not mark them missing", () => {
    const fetched = [apiRepo(1), apiRepo(2, { fork: true })];
    const stored = [{ id: 2, state: "active" }];
    const without = planSync({ fetched, stored, includeForks: false, nowIso: NOW });
    assert.equal(without.upserts.length, 1);
    assert.equal(without.stats.skipped_forks, 1);
    assert.deepEqual(without.missing, []);

    const withForks = planSync({ fetched, stored, includeForks: true, nowIso: NOW });
    assert.equal(withForks.upserts.length, 2);
  });

  it("marks archived repositories", () => {
    const row = normalizeRepo(apiRepo(9, { archived: true }), NOW);
    assert.equal(row.state, "archived");
    assert.equal(row.last_seen_at, NOW);
  });
});

describe("repoToProject", () => {
  it("creates a draft linked by repo id", () => {
    const repo = normalizeRepo(
      apiRepo(42, { name: "my-cool_app", topics: ["react", "firebase"], homepage: "https://app.web.app" }),
      NOW
    );
    const project = repoToProject(repo, { sortOrder: 50, slug: "my-cool-app" });
    assert.equal(project.status, "draft");
    assert.equal(project.github_repo_id, 42);
    assert.equal(project.source, "github");
    assert.equal(project.title, "My Cool App");
    assert.equal(project.category, "Web Apps & Dashboards");
    assert.deepEqual(project.tech, ["JavaScript", "React", "Firebase"], "tech topics get display names");
    assert.equal(project.demo_url, "https://app.web.app");
  });

  it("drops unsafe homepage URLs", () => {
    const repo = normalizeRepo(apiRepo(1, { homepage: "javascript:alert(1)" }), NOW);
    assert.equal(repoToProject(repo, { sortOrder: 10, slug: "x" }).demo_url, null);
  });

  it("guesses the kind of site from names, topics and README text", () => {
    assert.equal(guessCategory({ name: "3D-Gym-site", topics: [] }), "3D Websites");
    assert.equal(guessCategory({ name: "x", topics: ["threejs"] }), "3D Websites");
    assert.equal(guessCategory({ name: "noire", readme_summary: "A luxury fragrance storefront" }), "E-commerce");
    assert.equal(guessCategory({ name: "glass-pavilion-realestate" }), "Business Websites");
    assert.equal(guessCategory({ name: "kestrel-commerce-admin" }), "Web Apps & Dashboards");
    assert.equal(guessCategory({ name: "emotion", topics: ["machine-learning"] }), "AI & ML");
    assert.equal(guessCategory({ name: "misc" }), "Web Apps & Dashboards");
  });
});

describe("README details", () => {
  it("asks for details only when the repo has new pushes", () => {
    const plan = planSync({
      fetched: [apiRepo(1, { pushed_at: "2026-10-02T00:00:00Z" }), apiRepo(2), apiRepo(3)],
      stored: [
        { id: 1, state: "active", details_pushed_at: "2026-10-01T00:00:00+00:00" },
        { id: 2, state: "active", details_pushed_at: "2026-10-30T10:00:00+00:00" },
      ],
      includeForks: false,
      nowIso: NOW,
    });
    assert.deepEqual(plan.needDetails, [1, 3]);
  });

  it("builds a rich draft from README data", () => {
    const repo = {
      ...normalizeRepo(apiRepo(7, { name: "lun-ra", description: null, homepage: null, language: "TypeScript" }), NOW),
      languages: { TypeScript: 9000, CSS: 900, JavaScript: 40 },
      readme_title: "LUNÉRA — Luxury Hotel",
      readme_summary: "A cinematic hotel website.",
      readme_features: ["Cinematic hero", "Reservation form"],
      readme_tech: ["Next.js 16", "GSAP"],
      readme_topics: ["nextjs", "luxury"],
      readme_demo_url: "https://example.com/demo",
      readme_images: [
        { url: "https://raw.githubusercontent.com/me/lun-ra/main/1.jpg", alt: "Hero" },
        { url: "https://raw.githubusercontent.com/me/lun-ra/main/2.jpg", alt: "Rooms" },
      ],
    };
    const project = repoToProject(repo, { sortOrder: 10, slug: "lun-ra" });
    assert.equal(project.title, "LUNÉRA — Luxury Hotel");
    assert.equal(project.summary, "A cinematic hotel website.");
    assert.deepEqual(project.features, ["Cinematic hero", "Reservation form"]);
    assert.deepEqual(project.tech, ["Next.js 16", "GSAP", "TypeScript", "CSS"], "versioned duplicates collapse");
    assert.equal(project.category, "Business Websites", "a hotel website");
    assert.equal(project.thumbnail_url, "https://raw.githubusercontent.com/me/lun-ra/main/1.jpg");
    assert.deepEqual(project.gallery, [{ url: "https://raw.githubusercontent.com/me/lun-ra/main/2.jpg", alt: "Rooms" }]);
    assert.equal(project.demo_url, "https://example.com/demo");
    assert.deepEqual(project.tags, ["nextjs", "luxury"]);
  });

  it("ignores minor languages", () => {
    assert.deepEqual(mainLanguages({ TypeScript: 950, Shell: 10, CSS: 60 }), ["TypeScript", "CSS"]);
  });
});

describe("slugs", () => {
  it("slugifies names", () => {
    assert.equal(slugify("Al-Based Real-time Émotion!"), "al-based-real-time-emotion");
    assert.equal(slugify("***"), "project");
    assert.equal(humanizeRepoName("job-portal"), "Job Portal");
  });

  it("never reuses a taken slug", () => {
    const taken = new Set(["react", "react-2"]);
    assert.equal(uniqueSlug("React", taken), "react-3");
    assert.equal(uniqueSlug("React", taken), "react-4");
  });
});

describe("auto-publish rule", () => {
  const complete = {
    description: "A store",
    readme_summary: null,
    readme_images: [{ url: "https://raw.githubusercontent.com/me/x/main/a.png", alt: "" }],
    readme_features: ["Cart"],
  };

  it("accepts a complete README", () => {
    assert.deepEqual(missingForAutoPublish(complete, "complete"), []);
  });

  it("names what is missing", () => {
    assert.deepEqual(
      missingForAutoPublish({ ...complete, description: null, readme_images: [], readme_features: [] }, "complete"),
      ["description", "screenshots", "features"]
    );
  });

  it("only needs a description in described mode, and accepts a README summary", () => {
    assert.deepEqual(missingForAutoPublish({ description: null, readme_summary: "Text" }, "described"), []);
    assert.deepEqual(missingForAutoPublish({ description: null, readme_summary: null }, "described"), ["description"]);
  });

  it("never qualifies when off", () => {
    assert.ok(missingForAutoPublish(complete, "off").length > 0);
  });
});

describe("auto-update content", () => {
  it("contains only GitHub-derived fields, never status or order", () => {
    const repo = normalizeRepo(apiRepo(5, { topics: ["react"] }), NOW);
    const content = contentFromRepo(repo);
    assert.deepEqual(Object.keys(content).sort(), [
      "category", "demo_url", "features", "gallery", "repo_url", "summary", "tags", "tech", "thumbnail_url", "title",
    ]);
  });
});
