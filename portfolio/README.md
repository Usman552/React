# Usman Qasim — Portfolio

Personal portfolio built with React 19 + Vite. Dark/light theme, fully responsive,
no UI framework — plain CSS with design tokens.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run lint
```

## Where to edit content

All the text you'll want to change lives in `src/data/` — you shouldn't need to
touch component files for normal updates.

| File | What's in it |
| --- | --- |
| `src/data/projects.js` | Project cards — **add your Firebase Hosting links here** |
| `src/data/skills.js` | Skill groups + levels, services |
| `src/data/site.js` | Email, GitHub, LinkedIn, nav links, resume path |

### Adding a project

Open `src/data/projects.js` and fill in one entry:

```js
{
  title: "My App",
  category: "React",              // React | Next.js | Laravel | Other
  featured: true,                 // shows a "Featured" badge
  description: "Two short sentences — the card clamps this to 3 lines.",
  tech: ["React", "Firebase"],   // keep it to 3-4, the card stays compact
  image: "/shots/my-app.png",     // put the file in public/shots/, or null for a gradient
  gradient: "linear-gradient(135deg, #7c5cff, #38dfff)",
  demo: "https://my-app.web.app", // your Firebase Hosting URL
  github: "https://github.com/Usman552/my-app", // or null to hide the button
}
```

While `demo` is `"#"` the card shows a dashed *"Demo soon"* chip instead of a
dead link, so it's safe to deploy before every link is filled in.

Profile photo: replace `public/profile.png`.

### Resume / CV

Put your CV at **`public/resume.pdf`**. The "View Resume" buttons (hero, navbar
and contact section) open it in a new tab in the browser's PDF viewer — they do
not force a download, because there's no `download` attribute on the link.

To use a different filename or a Google Drive link instead, change `resumeUrl`
in `src/data/site.js`.

## Structure

```
src/
├── components/     one .jsx + .css per section
├── context/        theme provider + useTheme hook
├── data/           all editable content
├── hooks/          scroll reveal, count-up, typewriter, active section
└── index.css       design tokens, light/dark themes, shared utilities
```

## Theme

The theme is stored in `localStorage` under `portfolio-theme` and falls back to
the OS preference. An inline script in `index.html` applies it before first
paint so there's no flash of the wrong theme.
