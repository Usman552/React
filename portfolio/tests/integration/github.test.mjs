// GitHub sync and import. Sync logic runs against the real local database
// with a fake GitHub API, so results are deterministic and offline-safe.
// The original sync rows are snapshotted and restored afterwards.

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { runImport, runSync } from "../../supabase/functions/_shared/github.js";
import { callFunction, createUser, service, withoutMeta } from "./helpers.mjs";

// Ids far outside GitHub's current range so they never clash with real repos.
const A = 9_000_000_001;
const B = 9_000_000_002;
const C = 9_000_000_003; // complete README → auto-published
const D = 9_000_000_004; // no screenshots → stays out

let admin;
let stranger;
let configBefore;
let reposBefore;

const README = `# Fixture Showcase

A fixture project used by the integration tests.

![Home screen](docs/home.png)

## Features
- Fast pages
- Live search
`;

/** A fake GitHub: the repo list, a README on raw.githubusercontent.com, languages. */
function fakeGithub(repos, status = 200) {
  return async (url) => {
    if (status !== 200) return new Response(JSON.stringify({ message: "boom" }), { status });
    if (url.includes("raw.githubusercontent.com")) return new Response(README);
    if (url.endsWith("/languages")) return new Response(JSON.stringify({ TypeScript: 900, CSS: 100 }));
    if (url.includes("/users/")) return new Response(JSON.stringify(repos));
    return new Response("{}", { status: 404 });
  };
}

function apiRepo(id, overrides = {}) {
  return {
    id,
    name: `fixture-${id}`,
    full_name: `fixture/fixture-${id}`,
    description: "Fixture repository",
    html_url: `https://github.com/fixture/fixture-${id}`,
    homepage: null,
    default_branch: "main",
    language: "TypeScript",
    topics: ["react"],
    stargazers_count: 3,
    forks_count: 0,
    fork: false,
    archived: false,
    pushed_at: "2026-10-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

async function fixtureProjects() {
  const { data } = await service.from("projects").select("*").in("github_repo_id", [A, B]);
  return data;
}

before(async () => {
  admin = await createUser({ admin: true });
  stranger = await createUser({ admin: false });
  configBefore = (await service.from("github_sync").select("*").eq("id", 1).single()).data;
  reposBefore = (await service.from("github_repos").select("id, state")).data;
  await service
    .from("github_sync")
    .update({ username: "fixture", enabled: true, include_forks: false, auto_publish: "off" })
    .eq("id", 1);
});

after(async () => {
  await service.from("projects").delete().in("github_repo_id", [A, B, C, D]);
  await service.from("github_repos").delete().in("id", [A, B, C, D]);
  for (const repo of reposBefore) {
    await service.from("github_repos").update({ state: repo.state }).eq("id", repo.id);
  }
  await service.from("github_sync").update(withoutMeta(configBefore)).eq("id", 1);
  await admin.cleanup();
  await stranger.cleanup();
});

describe("github-sync function authorization", () => {
  it("rejects anonymous and non-admin callers", async () => {
    assert.equal((await callFunction("github-sync", { action: "sync" })).status, 401);
    assert.equal((await callFunction("github-sync", { action: "sync" }, { token: stranger.token })).status, 401);
  });

  it("rejects scheduled calls without the cron secret", async () => {
    const res = await callFunction("github-sync", { action: "scheduled" }, { headers: { "x-cron-secret": "wrong" } });
    assert.equal(res.status, 401);
  });
});

describe("sync and import", () => {
  it("imports repositories as drafts, without duplicates on repeat", async () => {
    const first = await runSync({ db: service, fetchImpl: fakeGithub([apiRepo(A), apiRepo(B)]) });
    assert.equal(first.ok, true, first.error);

    const second = await runSync({ db: service, fetchImpl: fakeGithub([apiRepo(A), apiRepo(B)]) });
    assert.equal(second.ok, true);
    assert.equal(second.result.new, 0, "a repeated sync creates no new repos");

    const { count } = await service.from("github_repos").select("id", { count: "exact", head: true }).in("id", [A, B]);
    assert.equal(count, 2);

    // Import through the deployed function, as the admin UI does, twice.
    for (let i = 0; i < 2; i += 1) {
      const res = await callFunction("github-sync", { action: "import", repoIds: [A, B] }, { token: admin.token });
      assert.equal(res.status, 200);
    }

    const projects = await fixtureProjects();
    assert.equal(projects.length, 2, "importing twice still yields one project per repo");
    assert.ok(projects.every((p) => p.status === "draft" && p.source === "github"));

    // README details flow into the draft: title, screenshot, features, languages.
    const imported = projects.find((p) => p.github_repo_id === A);
    assert.equal(imported.title, "Fixture Showcase");
    assert.equal(imported.thumbnail_url, `https://raw.githubusercontent.com/fixture/fixture-${A}/main/docs/home.png`);
    assert.deepEqual(imported.features, ["Fast pages", "Live search"]);
    assert.ok(imported.tech.includes("TypeScript"));
  });

  it("keeps manual customisations when metadata changes on GitHub", async () => {
    const [project] = (await fixtureProjects()).filter((p) => p.github_repo_id === A);
    await admin.client
      .from("projects")
      .update({ title: "My custom title", summary: "Hand-written summary", status: "published" })
      .eq("id", project.id);

    const renamed = apiRepo(A, { name: "renamed-on-github", description: "New description" });
    const result = await runSync({ db: service, fetchImpl: fakeGithub([renamed, apiRepo(B)]) });
    assert.equal(result.ok, true);

    const { data: after_ } = await service.from("projects").select("*").eq("id", project.id).single();
    assert.equal(after_.title, "My custom title");
    assert.equal(after_.summary, "Hand-written summary");
    assert.equal(after_.status, "published");

    const { data: repo } = await service.from("github_repos").select("name, description").eq("id", A).single();
    assert.equal(repo.name, "renamed-on-github", "repo metadata itself is refreshed");
  });

  it("flags missing repositories without deleting or unpublishing projects", async () => {
    const result = await runSync({ db: service, fetchImpl: fakeGithub([apiRepo(B)]) });
    assert.equal(result.ok, true);
    assert.ok(result.result.missing >= 1);

    const { data: repo } = await service.from("github_repos").select("state").eq("id", A).single();
    assert.equal(repo.state, "missing");

    const projects = await fixtureProjects();
    const linked = projects.find((p) => p.github_repo_id === A);
    assert.ok(linked, "the project still exists");
    assert.equal(linked.status, "published", "and is still published");
  });

  it("records GitHub failures without touching stored data", async () => {
    const reposBeforeFailure = (await service.from("github_repos").select("id, state, name").in("id", [A, B])).data;
    const projectsBeforeFailure = await fixtureProjects();

    const result = await runSync({ db: service, fetchImpl: fakeGithub(null, 500) });
    assert.equal(result.ok, false);

    const { data: status } = await service.from("github_sync").select("last_status, last_error").eq("id", 1).single();
    assert.equal(status.last_status, "error");
    assert.match(status.last_error, /500/);

    assert.deepEqual(
      (await service.from("github_repos").select("id, state, name").in("id", [A, B])).data,
      reposBeforeFailure
    );
    assert.deepEqual(await fixtureProjects(), projectsBeforeFailure);
  });

  it("refuses to run when sync is disabled", async () => {
    await service.from("github_sync").update({ enabled: false }).eq("id", 1);
    const result = await runSync({ db: service, fetchImpl: fakeGithub([]) });
    assert.equal(result.ok, false);
    assert.match(result.error, /disabled/);
  });

  it("import validates input", async () => {
    assert.equal((await runImport({ db: service, repoIds: [] })).ok, false);
  });
});

/** A fake GitHub where each repo has its own README (keyed by repo name). */
function fakeGithubWith(repos, readmes) {
  return async (url) => {
    if (url.includes("raw.githubusercontent.com")) {
      const name = Object.keys(readmes).find((n) => url.includes(`/${n}/`));
      return name ? new Response(readmes[name]) : new Response("", { status: 404 });
    }
    if (url.endsWith("/languages")) return new Response(JSON.stringify({ TypeScript: 100 }));
    if (url.includes("/users/")) return new Response(JSON.stringify(repos));
    return new Response("{}", { status: 404 });
  };
}

const completeReadme = (feature) => `# Fixture Store

A complete fixture project.

![Home](docs/home.png)

## Features
- ${feature}
`;

describe("push to publish", () => {
  const repoC = (pushed) => apiRepo(C, { name: "fixture-c", full_name: "fixture/fixture-c", pushed_at: pushed });
  const repoD = apiRepo(D, { name: "fixture-d", full_name: "fixture/fixture-d" });
  const readmes = (feature) => ({
    "fixture-c": completeReadme(feature),
    "fixture-d": "# D\n\nNo screenshots here.\n\n## Features\n- One",
  });

  before(async () => {
    await service.from("github_sync").update({ auto_publish: "complete", enabled: true }).eq("id", 1);
  });

  async function projectFor(id) {
    const { data } = await service.from("projects").select("*").eq("github_repo_id", id).maybeSingle();
    return data;
  }

  it("publishes a new repository with a complete README, and only that one", async () => {
    const result = await runSync({ db: service, fetchImpl: fakeGithubWith([repoC("2026-10-01T00:00:00Z"), repoD], readmes("Cart")) });
    assert.equal(result.ok, true, result.error);
    assert.equal(result.result.auto_published, 1);

    const project = await projectFor(C);
    assert.equal(project.status, "published");
    assert.equal(project.github_auto_update, true);
    assert.equal(project.title, "Fixture Store");
    assert.deepEqual(project.features, ["Cart"]);
    assert.ok(project.thumbnail_url.endsWith("/docs/home.png"), project.thumbnail_url);
    assert.equal(await projectFor(D), null, "a README without screenshots is not published");
  });

  it("does not publish twice", async () => {
    const result = await runSync({ db: service, fetchImpl: fakeGithubWith([repoC("2026-10-01T00:00:00Z"), repoD], readmes("Cart")) });
    assert.equal(result.result.auto_published, 0);
    const { count } = await service.from("projects").select("id", { count: "exact", head: true }).eq("github_repo_id", C);
    assert.equal(count, 1);
  });

  it("updates the project when the README changes", async () => {
    const result = await runSync({ db: service, fetchImpl: fakeGithubWith([repoC("2026-10-02T00:00:00Z"), repoD], readmes("Wishlist")) });
    assert.equal(result.result.auto_updated, 1);
    assert.deepEqual((await projectFor(C)).features, ["Wishlist"]);
  });

  it("leaves the project alone once auto-update is off", async () => {
    const project = await projectFor(C);
    await service.from("projects").update({ github_auto_update: false, title: "My own title" }).eq("id", project.id);
    await runSync({ db: service, fetchImpl: fakeGithubWith([repoC("2026-10-03T00:00:00Z"), repoD], readmes("Checkout")) });
    const after_ = await projectFor(C);
    assert.equal(after_.title, "My own title");
    assert.deepEqual(after_.features, ["Wishlist"]);
  });

  it("never brings back a project you deleted", async () => {
    const project = await projectFor(C);
    await service.from("projects").delete().eq("id", project.id);
    const { data: repo } = await service.from("github_repos").select("dismissed").eq("id", C).single();
    assert.equal(repo.dismissed, true);

    const result = await runSync({ db: service, fetchImpl: fakeGithubWith([repoC("2026-10-04T00:00:00Z"), repoD], readmes("Checkout")) });
    assert.equal(result.result.auto_published, 0);
    assert.equal(await projectFor(C), null);
  });
});
