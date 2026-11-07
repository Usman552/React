// GitHub synchronisation logic. Plain JS (no Deno/Node specific imports) so
// the Edge Function and the Node test suite share exactly the same code.
//
// Ground rules:
//  - Repositories are keyed by GitHub's numeric id, so renames never create
//    duplicates.
//  - Projects change only when the owner opted in: the auto-publish rule
//    (Admin → GitHub) publishes new repositories that meet it, and projects
//    with github_auto_update follow their README. Everything else is never
//    touched, so manual edits can't be overwritten.
//  - Manual import creates draft projects.
//  - Repositories whose project was deleted are dismissed and never re-added.
//  - The repository list is fetched before anything is written; a failed
//    fetch leaves stored data untouched.
//  - README + languages ("details") are fetched only for repositories with
//    new pushes, to stay inside GitHub's rate limit.

import { guessCategoryFromText } from "./categories.js";
import { parseReadme, uniqueCaseInsensitive } from "./readme.js";

const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";
const PER_PAGE = 100;
const MAX_PAGES = 10;
const DETAIL_CONCURRENCY = 4;

export const COVERS = ["violet-cyan", "pink-violet", "cyan-mint", "mint-violet", "cyan-violet"];

/** GitHub topics that name a technology, mapped to their display name. */
const TECH_TOPICS = {
  react: "React", reactjs: "React", "react-js": "React", nextjs: "Next.js", next: "Next.js", "next-js": "Next.js",
  typescript: "TypeScript", javascript: "JavaScript", tailwindcss: "Tailwind CSS", tailwind: "Tailwind CSS",
  gsap: "GSAP", threejs: "Three.js", "three-js": "Three.js", firebase: "Firebase", supabase: "Supabase",
  redux: "Redux", "redux-toolkit": "Redux Toolkit", vite: "Vite", nodejs: "Node.js", node: "Node.js",
  express: "Express", mongodb: "MongoDB", mysql: "MySQL", postgresql: "PostgreSQL", php: "PHP",
  laravel: "Laravel", bootstrap: "Bootstrap", python: "Python", flask: "Flask", django: "Django",
  "machine-learning": "Machine Learning", "deep-learning": "Deep Learning", tensorflow: "TensorFlow",
  html: "HTML", html5: "HTML", css: "CSS", css3: "CSS", sass: "Sass", "framer-motion": "Framer Motion",
  lenis: "Lenis", vue: "Vue", angular: "Angular",
};

export class GithubError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GithubError";
    this.status = status;
  }
}

function isRateLimited(res) {
  return (res.status === 403 || res.status === 429) && res.headers.get("x-ratelimit-remaining") === "0";
}

function describeFailure(res, username) {
  if (res.status === 404) return `GitHub user "${username}" was not found.`;
  if (res.status === 401) return "GitHub rejected the token (401). Check the GITHUB_TOKEN secret.";
  if (isRateLimited(res)) {
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    const when = Number.isFinite(reset) ? new Date(reset * 1000).toISOString() : "later";
    return `GitHub rate limit reached. It resets at ${when}. Adding a GITHUB_TOKEN raises the limit.`;
  }
  return `GitHub API responded with ${res.status}.`;
}

function apiHeaders(token, accept = "application/vnd.github+json") {
  const headers = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "portfolio-cms-sync",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Fetches every public repository owned by `username`. */
export async function fetchUserRepos({ username, token, fetchImpl = fetch }) {
  const repos = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = `${API}/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=${PER_PAGE}&page=${page}`;
    let res;
    try {
      res = await fetchImpl(url, { headers: apiHeaders(token) });
    } catch (err) {
      throw new GithubError(`Could not reach GitHub: ${err.message}`, 0);
    }
    if (!res.ok) throw new GithubError(describeFailure(res, username), res.status);

    const batch = await res.json();
    if (!Array.isArray(batch)) throw new GithubError("Unexpected response from GitHub.", res.status);
    repos.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return repos;
}

async function request(fetchImpl, url, init, label) {
  let res;
  try {
    res = await fetchImpl(url, init);
  } catch (err) {
    throw new GithubError(`Could not reach GitHub: ${err.message}`, 0);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new GithubError(describeFailure(res, label), res.status);
  return res;
}

/**
 * Fetches the README (raw Markdown) and language breakdown of one repo.
 * The README comes from raw.githubusercontent.com first, which doesn't count
 * against the API rate limit; the API is the fallback for other file names.
 * A missing README is not an error. Throws GithubError on other failures.
 */
export async function fetchRepoDetails({ fullName, branch, token, fetchImpl = fetch }) {
  const api = (path, accept) =>
    request(fetchImpl, `${API}/repos/${fullName}/${path}`, { headers: apiHeaders(token, accept) }, fullName);

  const readme = async () => {
    const raw = await request(
      fetchImpl,
      `${RAW}/${fullName}/${encodeURIComponent(branch || "HEAD")}/README.md`,
      { headers: { "User-Agent": "portfolio-cms-sync" } },
      fullName
    );
    const res = raw ?? (await api("readme", "application/vnd.github.raw+json"));
    return res ? res.text() : null;
  };

  const [markdown, languagesRes] = await Promise.all([readme(), api("languages")]);
  return {
    readme: markdown,
    languages: languagesRes ? await languagesRes.json() : {},
  };
}

/** Maps a GitHub API repository object to a github_repos row (metadata only). */
export function normalizeRepo(repo, nowIso) {
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description || null,
    html_url: repo.html_url,
    homepage: repo.homepage || null,
    language: repo.language || null,
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    default_branch: repo.default_branch || null,
    stargazers: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    is_fork: Boolean(repo.fork),
    archived: Boolean(repo.archived),
    pushed_at: repo.pushed_at || null,
    repo_created_at: repo.created_at || null,
    repo_updated_at: repo.updated_at || null,
    state: repo.archived ? "archived" : "active",
    last_seen_at: nowIso,
  };
}

/** The github_repos columns derived from a README + languages fetch. */
export function detailColumns(row, details) {
  const parsed = parseReadme(details.readme, { fullName: row.full_name, branch: row.default_branch });
  return {
    // Only a { name: bytes } object is valid; anything else is stored as empty.
    languages:
      details.languages && typeof details.languages === "object" && !Array.isArray(details.languages)
        ? details.languages
        : {},
    readme_title: parsed.title,
    readme_summary: parsed.summary,
    readme_features: parsed.features,
    readme_tech: parsed.tech,
    readme_topics: parsed.topics,
    readme_demo_url: parsed.demoUrl,
    readme_images: parsed.images,
    details_pushed_at: row.pushed_at,
    details_error: null,
  };
}

function sameInstant(a, b) {
  return Boolean(a && b) && new Date(a).getTime() === new Date(b).getTime();
}

/**
 * Pure planning step: what to upsert, which stored repos went missing, and
 * which repos need their README/languages (re)fetched.
 * `fetched` is the raw API list; `stored` is [{ id, state, details_pushed_at }].
 */
export function planSync({ fetched, stored, includeForks, nowIso }) {
  const fetchedIds = new Set(fetched.map((r) => r.id));
  const storedById = new Map(stored.map((r) => [r.id, r]));

  const upserts = fetched
    .filter((r) => includeForks || !r.fork)
    .map((r) => normalizeRepo(r, nowIso));

  const missing = stored
    .filter((r) => !fetchedIds.has(r.id) && r.state !== "missing")
    .map((r) => r.id);

  const needDetails = upserts
    .filter((r) => !sameInstant(storedById.get(r.id)?.details_pushed_at, r.pushed_at))
    .map((r) => r.id);

  return {
    upserts,
    missing,
    needDetails,
    stats: {
      fetched: fetched.length,
      skipped_forks: fetched.length - upserts.length,
      new: upserts.filter((r) => !storedById.has(r.id)).length,
      updated: upserts.filter((r) => storedById.has(r.id)).length,
      missing: missing.length,
    },
  };
}

/**
 * Fetches details for the given rows, a few at a time. Stops early when the
 * rate limit is hit. Returns Map(id -> columns) and Map(id -> error message).
 */
async function collectDetails(rows, { token, fetchImpl }) {
  const details = new Map();
  const errors = new Map();
  let rateLimited = false;

  for (let i = 0; i < rows.length && !rateLimited; i += DETAIL_CONCURRENCY) {
    const batch = rows.slice(i, i + DETAIL_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((row) => fetchRepoDetails({ fullName: row.full_name, branch: row.default_branch, token, fetchImpl }))
    );
    results.forEach((result, j) => {
      const row = batch[j];
      if (result.status === "fulfilled") {
        details.set(row.id, detailColumns(row, result.value));
      } else {
        errors.set(row.id, String(result.reason?.message || result.reason).slice(0, 300));
        if (/rate limit/i.test(errors.get(row.id))) rateLimited = true;
      }
    });
  }
  return { details, errors, rateLimited };
}

function check({ error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

/**
 * Runs a full sync. `db` is a supabase-js client created with the service
 * role key. Returns { ok, result } or { ok: false, error }.
 */
export async function runSync({ db, token, fetchImpl = fetch, now = new Date() }) {
  const nowIso = now.toISOString();

  const { data: config, error: configError } = await db
    .from("github_sync")
    .select("username, enabled, include_forks, auto_publish")
    .eq("id", 1)
    .single();
  if (configError) return { ok: false, error: `Could not read sync settings: ${configError.message}` };
  if (!config.username) return { ok: false, error: "Set a GitHub username before syncing." };
  if (!config.enabled) return { ok: false, error: "GitHub sync is disabled." };

  check(
    await db.from("github_sync").update({ last_status: "running", last_run_at: nowIso }).eq("id", 1),
    "Could not update sync status"
  );

  try {
    const fetched = await fetchUserRepos({ username: config.username, token, fetchImpl });

    const { data: stored, error: storedError } = await db.from("github_repos").select("id, state, details_pushed_at");
    if (storedError) throw new Error(`Could not read stored repositories: ${storedError.message}`);

    const plan = planSync({ fetched, stored, includeForks: config.include_forks, nowIso });
    const wanted = plan.upserts.filter((r) => plan.needDetails.includes(r.id));
    const { details, errors, rateLimited } = await collectDetails(wanted, { token, fetchImpl });

    // PostgREST fills absent keys with null in bulk writes, so each batch
    // must have identical keys: rows with fresh details, rows with a details
    // error, and rows whose stored details are kept as they are.
    const withDetails = plan.upserts.filter((r) => details.has(r.id)).map((r) => ({ ...r, ...details.get(r.id) }));
    const withError = plan.upserts.filter((r) => errors.has(r.id)).map((r) => ({ ...r, details_error: errors.get(r.id) }));
    const unchanged = plan.upserts.filter((r) => !details.has(r.id) && !errors.has(r.id));

    for (const [rows, label] of [[withDetails, "repository details"], [withError, "repositories"], [unchanged, "repositories"]]) {
      if (rows.length) check(await db.from("github_repos").upsert(rows, { onConflict: "id" }), `Could not save ${label}`);
    }
    if (plan.missing.length) {
      check(
        await db.from("github_repos").update({ state: "missing" }).in("id", plan.missing),
        "Could not flag missing repositories"
      );
    }

    const automation = await applyAutomation({
      db,
      rule: config.auto_publish || "off",
      refreshedIds: new Set(details.keys()),
    });

    const result = {
      ...plan.stats,
      details_refreshed: details.size,
      details_failed: errors.size,
      ...automation,
      finished_at: new Date().toISOString(),
    };
    const warning = rateLimited
      ? "GitHub rate limit reached while reading READMEs. The rest are fetched on the next sync, or add a GITHUB_TOKEN."
      : null;
    check(
      await db
        .from("github_sync")
        .update({ last_status: "success", last_success_at: nowIso, last_error: warning, last_result: result })
        .eq("id", 1),
      "Could not record sync result"
    );
    return { ok: true, result };
  } catch (err) {
    await db
      .from("github_sync")
      .update({ last_status: "error", last_error: String(err.message).slice(0, 500) })
      .eq("id", 1);
    return { ok: false, error: err.message };
  }
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "project";
}

export function humanizeRepoName(name) {
  return String(name)
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** README title when there is one ("LUNÉRA — Luxury Hotel Website"), else the repo name. */
function projectTitle(repo) {
  return repo.readme_title || humanizeRepoName(repo.name);
}

/** Languages with at least 5% of the code, largest first. */
export function mainLanguages(languages) {
  const entries = Object.entries(languages || {}).filter(([, bytes]) => Number(bytes) > 0);
  const total = entries.reduce((sum, [, bytes]) => sum + Number(bytes), 0);
  return entries
    .filter(([, bytes]) => total && Number(bytes) / total >= 0.05)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

/**
 * Tech list for a project: README stack first, then languages, then tech
 * topics. "Next.js 16" and "Next.js" count as the same entry.
 */
export function buildTech(repo) {
  const topics = [...(repo.topics || []), ...(repo.readme_topics || [])];
  const seen = new Set();
  return uniqueCaseInsensitive([
    ...(repo.readme_tech || []),
    ...mainLanguages(repo.languages),
    ...(repo.language ? [repo.language] : []),
    ...topics.map((t) => TECH_TOPICS[String(t).toLowerCase()]).filter(Boolean),
  ])
    .filter((name) => {
      const base = name.toLowerCase().replace(/\s+v?\d[\d.x]*$/, "");
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    })
    .slice(0, 8);
}

/** Category by kind of site (3D, e-commerce…), guessed from everything we know. */
export function guessCategory(repo) {
  return guessCategoryFromText(
    repo.name,
    repo.description,
    repo.readme_title,
    repo.readme_summary,
    repo.topics,
    repo.readme_topics,
    repo.readme_tech
  );
}

function safeHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\/[^\s<>"]+$/i.test(value) ? value : null;
}

/** Builds a draft project row from a stored github_repos row. */
export function repoToProject(repo, { sortOrder, slug }) {
  const images = (Array.isArray(repo.readme_images) ? repo.readme_images : []).filter((img) => safeHttpUrl(img?.url));
  const tags = uniqueCaseInsensitive([...(repo.topics || []), ...(repo.readme_topics || [])]);

  return {
    slug,
    title: projectTitle(repo).slice(0, 120),
    summary: (repo.description || repo.readme_summary || "").slice(0, 400),
    features: (repo.readme_features || []).slice(0, 12),
    category: guessCategory(repo),
    tech: buildTech(repo),
    tags: tags.slice(0, 12),
    thumbnail_url: images[0]?.url ?? null,
    gallery: images.slice(1, 7).map((img) => ({ url: img.url, alt: img.alt || "" })),
    cover: COVERS[Math.abs(Number(repo.id)) % COVERS.length],
    demo_url: safeHttpUrl(repo.homepage) || safeHttpUrl(repo.readme_demo_url),
    repo_url: safeHttpUrl(repo.html_url),
    status: "draft",
    featured: false,
    show_on_home: true,
    sort_order: sortOrder,
    source: "github",
    github_repo_id: repo.id,
  };
}

/** Picks a slug that isn't in `taken`, adding -2, -3… when needed. */
export function uniqueSlug(base, taken) {
  let slug = slugify(base);
  let n = 2;
  while (taken.has(slug)) {
    const suffix = `-${n}`;
    slug = `${slugify(base).slice(0, 80 - suffix.length)}${suffix}`;
    n += 1;
  }
  taken.add(slug);
  return slug;
}

// Project fields that come from GitHub. Auto-update refreshes only these;
// status, featured, order, slug and visibility always stay as set in the admin.
const CONTENT_FIELDS = [
  "title", "summary", "features", "category", "tech", "tags", "thumbnail_url", "gallery", "demo_url", "repo_url",
];

export function contentFromRepo(repo) {
  const row = repoToProject(repo, { sortOrder: 0, slug: "" });
  return Object.fromEntries(CONTENT_FIELDS.map((key) => [key, row[key]]));
}

/**
 * What a repository still needs before the auto-publish rule accepts it.
 * Empty array = ready. Shown in Admin → GitHub so the README can be fixed.
 */
export function missingForAutoPublish(repo, rule) {
  if (rule === "off") return ["auto-publish is off"];
  const missing = [];
  if (!repo.description && !repo.readme_summary) missing.push("description");
  if (rule === "complete") {
    if (!(Array.isArray(repo.readme_images) && repo.readme_images.length)) missing.push("screenshots");
    if (!(Array.isArray(repo.readme_features) && repo.readme_features.length)) missing.push("features");
  }
  return missing;
}

/**
 * Runs after every sync:
 *  - publishes new repositories that meet the auto-publish rule (newest first),
 *    skipping archived, missing and dismissed ones;
 *  - refreshes projects that follow their README (github_auto_update) when
 *    their repository's README was re-read in this run.
 */
export async function applyAutomation({ db, rule, refreshedIds }) {
  const [{ data: repos, error: reposError }, { data: projects, error: projectsError }] = await Promise.all([
    db.from("github_repos").select("*").eq("state", "active").eq("dismissed", false),
    db.from("projects").select("id, slug, sort_order, github_repo_id, github_auto_update"),
  ]);
  if (reposError) throw new Error(`Could not read repositories: ${reposError.message}`);
  if (projectsError) throw new Error(`Could not read projects: ${projectsError.message}`);

  const byId = new Map(repos.map((r) => [Number(r.id), r]));
  const linked = new Set(projects.map((p) => p.github_repo_id).filter((v) => v != null).map(Number));

  // 1. Keep auto-updating projects in step with their README.
  let autoUpdated = 0;
  for (const project of projects) {
    const repo = byId.get(Number(project.github_repo_id));
    if (!project.github_auto_update || !repo || !refreshedIds.has(repo.id)) continue;
    check(await db.from("projects").update(contentFromRepo(repo)).eq("id", project.id), "Could not update project");
    autoUpdated += 1;
  }

  // 2. Publish new, complete repositories. Newest pushes go to the top.
  let autoPublished = 0;
  if (rule !== "off") {
    const candidates = repos
      .filter((r) => !linked.has(Number(r.id)) && missingForAutoPublish(r, rule).length === 0)
      .sort((a, b) => new Date(a.pushed_at || 0) - new Date(b.pushed_at || 0));

    if (candidates.length) {
      const taken = new Set(projects.map((p) => p.slug));
      let order = projects.reduce((min, p) => Math.min(min, p.sort_order), 0);
      const rows = candidates.map((repo) => {
        order -= 10;
        return {
          ...repoToProject(repo, { sortOrder: order, slug: uniqueSlug(repo.name, taken) }),
          status: "published",
          github_auto_update: true,
        };
      });
      check(
        await db.from("projects").upsert(rows, { onConflict: "github_repo_id", ignoreDuplicates: true }),
        "Could not publish new repositories"
      );
      autoPublished = rows.length;
    }
  }

  return { auto_published: autoPublished, auto_updated: autoUpdated };
}

/**
 * Imports the given repositories as draft projects. Repos that already have
 * a project are skipped, so calling this twice never creates duplicates.
 */
export async function runImport({ db, repoIds }) {
  const ids = [...new Set((repoIds || []).map(Number).filter(Number.isSafeInteger))];
  if (!ids.length) return { ok: false, error: "Select at least one repository." };
  if (ids.length > 100) return { ok: false, error: "Import at most 100 repositories at once." };

  const { data: repos, error: reposError } = await db.from("github_repos").select("*").in("id", ids);
  if (reposError) return { ok: false, error: reposError.message };

  const { data: projects, error: projectsError } = await db
    .from("projects")
    .select("slug, sort_order, github_repo_id");
  if (projectsError) return { ok: false, error: projectsError.message };

  const linked = new Set(projects.map((p) => p.github_repo_id).filter((v) => v != null).map(Number));
  const taken = new Set(projects.map((p) => p.slug));
  let order = projects.reduce((max, p) => Math.max(max, p.sort_order), 0);

  const rows = repos
    .filter((repo) => !linked.has(Number(repo.id)))
    .map((repo) => {
      order += 10;
      return repoToProject(repo, { sortOrder: order, slug: uniqueSlug(repo.name, taken) });
    });

  if (rows.length) {
    const { error } = await db
      .from("projects")
      .upsert(rows, { onConflict: "github_repo_id", ignoreDuplicates: true });
    if (error) return { ok: false, error: error.message };
  }

  return {
    ok: true,
    result: {
      imported: rows.length,
      skipped: ids.length - rows.length,
      not_found: ids.length - repos.length,
    },
  };
}
