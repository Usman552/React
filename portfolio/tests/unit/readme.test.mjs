import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseReadme, resolveImageUrl, stripMarkdown } from "../../supabase/functions/_shared/readme.js";

const repo = { fullName: "Usman552/demo", branch: "main" };

// Trimmed from real READMEs in github.com/Usman552.
const HOTEL = `# LUNÉRA — Luxury Hotel Website

A cinematic, scroll-driven luxury hotel website: five connected hero scenes, editorial sections and a reservation entry point.

**Live demo:** https://usman552.github.io/LUN-RA-Hotel-website/

**Topics:** \`nextjs\` \`react\` \`gsap\` \`hotel-website\`

## Features
- **Cinematic hero** — pinned, scrubbed 5-scene story built from layered photography.
- **Reservation form** — validated front-end prototype.
- Smooth scrolling (Lenis), masked image reveals, staggered text, parallax, hover zooms.

## Tech
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · GSAP + ScrollTrigger · Lenis.

## Run locally
\`\`\`bash
- npm install   # not a feature
\`\`\`
`;

const PHARMACY = `# CityDrug — Online Pharmacy Management System

An online pharmacy storefront and admin back office built with **Laravel 12** and **MySQL**.

![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel)
![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?logo=php)
![Tests](https://img.shields.io/badge/tests-59%20passing-087F5B)

![CityDrug home page](docs/screenshots/01-home.jpg)

## Highlights

- **Pharmacist-verified prescriptions.** Staff upload a prescription and a pharmacist verifies it.
- **Server-trusted checkout.** The browser never sets a price.

## Screenshots

| Storefront | Shop |
|---|---|
| ![Home](docs/screenshots/01-home.jpg) | ![Shop](docs/screenshots/02-shop.jpg) |
`;

const CENTERED = `<div align="center">

# NOIRÉ

### An art-directed luxury fragrance storefront

A fully shoppable e-commerce front end for a **fictional** perfume house.

**[🌐 Live demo](https://usman552.github.io/noire-fragrance/)** · **[Checkout](https://usman552.github.io/noire-fragrance/checkout/)**

<img src="./docs/hero.png" alt="Hero" width="600">
<img src="https://example.com/logo.svg" alt="Logo">

</div>
`;

describe("parseReadme", () => {
  it("extracts summary, features, tech, topics and demo link", () => {
    const r = parseReadme(HOTEL, repo);
    assert.equal(r.title, "LUNÉRA — Luxury Hotel Website");
    assert.match(r.summary, /^A cinematic, scroll-driven luxury hotel website/);
    assert.equal(r.demoUrl, "https://usman552.github.io/LUN-RA-Hotel-website/");
    assert.deepEqual(r.topics, ["nextjs", "react", "gsap", "hotel-website"]);
    assert.equal(r.features.length, 3);
    assert.match(r.features[0], /^Cinematic hero — pinned/);
    assert.deepEqual(r.tech.slice(0, 5), ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4", "GSAP"]);
    assert.ok(!r.features.some((f) => f.includes("npm install")), "code blocks are ignored");
  });

  it("uses a Highlights section, badge names and resolves screenshot paths", () => {
    const r = parseReadme(PHARMACY, repo);
    assert.match(r.summary, /built with Laravel 12 and MySQL\.$/, "markdown is stripped");
    assert.equal(r.features.length, 2);
    assert.deepEqual(r.tech, ["Laravel", "PHP"], "the 'Tests' badge is not a technology");
    assert.deepEqual(
      r.images.map((i) => i.url),
      [
        "https://raw.githubusercontent.com/Usman552/demo/main/docs/screenshots/01-home.jpg",
        "https://raw.githubusercontent.com/Usman552/demo/main/docs/screenshots/02-shop.jpg",
      ],
      "badges are skipped and duplicates removed"
    );
    assert.equal(r.images[0].alt, "CityDrug home page");
  });

  it("handles centred HTML layouts and <img> tags", () => {
    const r = parseReadme(CENTERED, repo);
    assert.equal(r.summary, "A fully shoppable e-commerce front end for a fictional perfume house.");
    assert.equal(r.demoUrl, "https://usman552.github.io/noire-fragrance/");
    assert.deepEqual(r.images, [{ url: "https://raw.githubusercontent.com/Usman552/demo/main/docs/hero.png", alt: "Hero" }]);
  });

  it("reads tech stacks written as tables", () => {
    const md = `# Clinic

## Tech stack

| Area | Choice |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router, static generation) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4 (design tokens in \`app/globals.css\`) |
| Fonts | \`next/font\`: Manrope, Cormorant Garamond |
| i18n | Lightweight route-based with typed dictionaries |
`;
    assert.deepEqual(parseReadme(md, repo).tech, ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4"]);
  });

  it("ignores starter-template titles and text", () => {
    const r = parseReadme(
      "# Getting Started with Create React App\n\nThis project was bootstrapped with Create React App.",
      repo
    );
    assert.equal(r.title, null);
    assert.equal(r.summary, null);
  });

  it("keeps lowercase libraries and scoped packages, drops paths", () => {
    const md = `## Tech

| Area | Tools |
|---|---|
| Framework | React 19, Vite |
| 3D | three.js, @react-three/fiber |
| Assets | loaded from cdnjs, app/globals.css |
`;
    assert.deepEqual(parseReadme(md, repo).tech, ["React 19", "Vite", "three.js", "@react-three/fiber"]);
  });

  it("returns empty results for a missing or bare README", () => {
    for (const input of [null, "", "# Title only"]) {
      const r = parseReadme(input, repo);
      assert.deepEqual([r.summary, r.features, r.images, r.demoUrl], [null, [], [], null]);
    }
  });
});

describe("README helpers", () => {
  it("resolves image URLs safely", () => {
    assert.equal(
      resolveImageUrl("/docs/a.png", repo),
      "https://raw.githubusercontent.com/Usman552/demo/main/docs/a.png"
    );
    assert.equal(
      resolveImageUrl("https://github.com/o/r/blob/dev/img/x.png", repo),
      "https://raw.githubusercontent.com/o/r/dev/img/x.png"
    );
    assert.equal(resolveImageUrl("javascript:alert(1)", repo), null);
    assert.equal(resolveImageUrl("data:image/png;base64,xx", repo), null);
    assert.equal(resolveImageUrl("//evil.com/x.png", repo), null);
  });

  it("strips inline markdown", () => {
    assert.equal(stripMarkdown("**Bold** and `code` with [a link](https://x.y)"), "Bold and code with a link");
  });
});
