// Extracts portfolio details from a repository README (GitHub-flavoured
// Markdown). Plain JS, no dependencies: runs in Deno and in Node tests.
//
//   title     first H1, unless it is a starter-template heading
//   summary   first prose paragraph (badges, images and headings skipped)
//   features  bullets under a "Features" / "Highlights" heading
//   tech      items under a "Tech" / "Tech stack" / "Built with" heading,
//             plus the alt text of technology badges
//   topics    `code` words on a "Topics:" line
//   demoUrl   the link on a "Live demo" line
//   images    screenshots (badges and SVG icons excluded), as absolute URLs

const MAX_FEATURES = 8;
const MAX_FEATURE_LENGTH = 160;
const MAX_IMAGES = 6;
const MAX_SUMMARY = 400;

const FEATURE_HEADING = /^(key\s+)?(features|highlights|what it does|functionality)\b/i;
const TECH_HEADING = /^(tech(nology|nologies)?(\s+stack)?|stack|built with|tools|technologies used)\b/i;
const BADGE_HOST = /(shields\.io|badgen\.net|badge\.fury\.io|travis-ci|circleci|codecov|\/badge(\.svg)?|\/workflows\/|vercel\.com\/button|deploy-button)/i;
// Badge labels that describe the repo, not a technology.
const NON_TECH_BADGES = /^(tests?|build|ci|cd|license|coverage|status|deployed|deploy|version|release|downloads|total downloads|latest|stars|prs welcome|made with love|maintained)/i;

/** Removes inline Markdown so text can be shown as plain text. */
export function stripMarkdown(text) {
  return String(text)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(\S(?:.*?\S)?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.—-]+$/, "")}…`;
}

/** Splits a README into lines with fenced code blocks removed. */
function contentLines(markdown) {
  const lines = [];
  let fenced = false;
  for (const line of String(markdown).replace(/\r\n?/g, "\n").split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (!fenced) lines.push(line);
  }
  return lines;
}

function headingOf(line) {
  const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line.trim());
  return match ? { level: match[1].length, text: stripMarkdown(match[2]) } : null;
}

/** Lines that belong to the first section whose heading matches `pattern`. */
function section(lines, pattern) {
  const start = lines.findIndex((line) => {
    const h = headingOf(line);
    return h && h.level >= 2 && pattern.test(h.text.replace(/^[^\p{L}]+/u, ""));
  });
  if (start === -1) return null;

  const level = headingOf(lines[start]).level;
  const body = [];
  for (const line of lines.slice(start + 1)) {
    const h = headingOf(line);
    if (h && h.level <= level) break;
    body.push(line);
  }
  return body;
}

function bullets(lines) {
  return lines
    .map((line) => /^\s{0,3}(?:[-*+]|\d+[.)])\s+(.+)$/.exec(line))
    .filter(Boolean)
    .map((match) => stripMarkdown(match[1]))
    .filter(Boolean);
}

// Starter-template READMEs that say nothing about the actual project.
const BOILERPLATE = /^(this project was bootstrapped|laravel is a web application framework|this template provides|getting started with create react app|react \+ vite|create next app)/i;
const GENERIC_TITLES = /^(readme|getting started|create react app|react \+ vite|vite|laravel|next\.js|project|my project)$/i;

/** The README's first level-1 heading, if it names the project. */
export function extractTitle(markdown) {
  const md = /^#\s+(.+?)\s*#*\s*$/m.exec(markdown);
  const html = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(markdown);
  const title = stripMarkdown((md && md[1]) || (html && html[1]) || "");
  if (!title || GENERIC_TITLES.test(title) || BOILERPLATE.test(title)) return null;
  return truncate(title, 120);
}

export function extractSummary(lines) {
  let paragraph = [];
  for (const raw of lines) {
    const line = raw.trim();
    const isProse =
      line &&
      !headingOf(line) &&
      !/^(!\[|\[!\[|<|>|\||[-*+]\s|\d+[.)]\s|---|\*\*\*|===)/.test(line) &&
      !/^\*\*[^*]+:\*\*/.test(line); // "**Live demo:** …" style label lines

    if (isProse) {
      paragraph.push(line);
    } else if (paragraph.length) {
      break;
    }
  }
  const text = stripMarkdown(paragraph.join(" "));
  if (text.length < 20 || BOILERPLATE.test(text)) return null;
  return truncate(text, MAX_SUMMARY);
}

export function extractFeatures(lines) {
  const body = section(lines, FEATURE_HEADING);
  if (!body) return [];
  return bullets(body)
    .slice(0, MAX_FEATURES)
    .map((item) => truncate(item, MAX_FEATURE_LENGTH));
}

function cleanTechItem(item) {
  return stripMarkdown(item)
    .replace(/\([^)]*\)/g, "")
    .replace(/[.:;]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Capitalised names, scoped npm packages, or a single lowercase library word with a dot ("three.js"). */
function isTechName(t) {
  if (/^@[a-z0-9-]+\/[a-z0-9.-]+$/i.test(t)) return true;
  if (t.includes("/")) return false;
  if (/^[A-Z0-9]/.test(t)) return true;
  return /^[a-z][a-z0-9-]*\.(js|ts)$/i.test(t);
}

// Table rows in a tech section that list non-technology details.
const NON_TECH_ROWS = /font|i18n|locali|image|photo|icon|content|licen|test|data source/i;

/** "| Framework | Next.js 16 |" rows → the value cells, minus the header row. */
function tableValues(body) {
  const rows = body
    .filter((line) => line.trim().startsWith("|"))
    .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => stripMarkdown(cell)));
  return rows
    .slice(1) // header
    .filter((cells) => !cells.every((c) => /^:?-{2,}:?$/.test(c))) // separator
    .filter((cells) => cells.length < 2 || !NON_TECH_ROWS.test(cells[0]))
    .map((cells) => cells[cells.length >= 2 ? 1 : 0]);
}

export function extractTech(lines, badgeAlts = []) {
  const items = [];
  const body = section(lines, TECH_HEADING);
  if (body) {
    const listed = bullets(body);
    const table = tableValues(body);
    const source = listed.length
      ? listed
      : table.length
        ? table
        : body.filter((l) => l.trim() && !headingOf(l)).map(stripMarkdown);
    for (const entry of source) {
      // "Next.js 16 · React 19 · TypeScript" or "Frontend: React, Vite"
      const label = /^[^:]{1,30}:\s/.exec(entry);
      const value = label ? entry.slice(label[0].length) : entry;
      // Drop "(App Router, static generation)" asides before splitting on commas.
      items.push(...value.replace(/\([^)]*\)/g, "").split(/\s*(?:·|•|\||,|\s\+\s|\band\b)\s*/));
    }
  }
  items.push(...badgeAlts.filter((alt) => !NON_TECH_BADGES.test(alt)));
  return uniqueCaseInsensitive(
    items
      .map(cleanTechItem)
      // Technology names are short: "Next.js 16", "three.js", "@react-three/fiber".
      // Prose fragments ("loaded from cdnjs") and paths ("app/globals.css") are not.
      .filter((t) => t.length >= 2 && t.length <= 30 && t.split(" ").length <= 3 && isTechName(t))
  );
}

export function extractTopics(lines) {
  const line = lines.find((l) => /^\s*\**topics\**\s*:/i.test(l));
  if (!line) return [];
  return [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim()).filter(Boolean);
}

export function extractDemoUrl(lines) {
  for (const line of lines) {
    if (!/\b(live\s+(demo|site|preview)|demo|website)\b/i.test(line)) continue;
    const match = /(https?:\/\/[^\s)<>"'`\]]+)/.exec(line);
    if (match && !/github\.com\/[^/]+\/[^/]+\/?$/.test(match[1]) && !BADGE_HOST.test(match[1])) {
      return match[1].replace(/[.,]+$/, "");
    }
  }
  return null;
}

/** Turns README-relative image paths into absolute raw.githubusercontent URLs. */
export function resolveImageUrl(src, { fullName, branch }) {
  const value = String(src || "").trim().replace(/^<|>$/g, "");
  if (!value || value.startsWith("data:")) return null;

  // https://github.com/owner/repo/blob/main/x.png → raw file URL
  const blob = /^https?:\/\/github\.com\/([^/]+\/[^/]+)\/(?:blob|raw)\/(.+)$/i.exec(value);
  if (blob) return `https://raw.githubusercontent.com/${blob[1]}/${blob[2].replace(/\?raw=true$/, "")}`;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z]+:/i.test(value) || value.startsWith("//")) return null;

  const base = `https://raw.githubusercontent.com/${fullName}/${branch || "HEAD"}/`;
  try {
    return new URL(value.replace(/^\/+/, ""), base).href;
  } catch {
    return null;
  }
}

function isScreenshot(url) {
  return !BADGE_HOST.test(url) && !/\.svg(\?|#|$)/i.test(url);
}

/** Collects image references in document order: Markdown and HTML <img>. */
function imageRefs(markdown) {
  const refs = [];
  const pattern = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)|<img\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi;
  for (const match of String(markdown).matchAll(pattern)) {
    if (match[2]) refs.push({ src: match[2], alt: match[1] });
    else {
      const alt = /\balt=["']([^"']*)["']/i.exec(match[0]);
      refs.push({ src: match[3], alt: alt ? alt[1] : "" });
    }
  }
  return refs;
}

export function extractImages(markdown, repo) {
  const seen = new Set();
  const images = [];
  for (const { src, alt } of imageRefs(markdown)) {
    const url = resolveImageUrl(src, repo);
    if (!url || !isScreenshot(url) || seen.has(url)) continue;
    seen.add(url);
    images.push({ url, alt: stripMarkdown(alt).slice(0, 160) });
    if (images.length === MAX_IMAGES) break;
  }
  return images;
}

function badgeAlts(markdown) {
  return imageRefs(markdown)
    .filter(({ src }) => BADGE_HOST.test(src))
    .map(({ alt }) => stripMarkdown(alt).replace(/[_-]+/g, " ").trim())
    .filter(Boolean);
}

export function uniqueCaseInsensitive(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Parses a README. `repo` is { fullName, branch } and is used to resolve
 * relative image paths. Never throws: unknown formats just yield less data.
 */
export function parseReadme(markdown, repo) {
  if (typeof markdown !== "string" || !markdown.trim()) {
    return { title: null, summary: null, features: [], tech: [], topics: [], demoUrl: null, images: [] };
  }
  const lines = contentLines(markdown);
  return {
    title: extractTitle(markdown),
    summary: extractSummary(lines),
    features: extractFeatures(lines),
    tech: extractTech(lines, badgeAlts(markdown)).slice(0, 12),
    topics: extractTopics(lines).slice(0, 20),
    demoUrl: extractDemoUrl(lines),
    images: extractImages(markdown, repo),
  };
}
