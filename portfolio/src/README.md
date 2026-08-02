# Animated Portfolio (React) — "Aurora Glass" Theme

## Where to place the files

Copy these files into your React project's `src/` folder, keeping the
exact same structure (overwrite `App.jsx` / `index.css` if you already
have them):

```
src/
├── App.jsx
├── index.css
├── hooks/
│   ├── useScrollReveal.js
│   ├── useTilt.js
│   └── useCountUp.js
└── components/
    ├── Navbar.jsx / Navbar.css
    ├── Hero.jsx / Hero.css
    ├── About.jsx / About.css
    ├── Skills.jsx / Skills.css
    ├── Projects.jsx / Projects.css
    ├── Contact.jsx / Contact.css
    └── Footer.jsx / Footer.css
```

## Adding your photo

`Hero.jsx` looks for your photo at `/profile.jpg`.

1. Put your photo file in the `public/` folder of your project (both
   Vite and Create React App have one at the root).
2. Name it `profile.jpg` — or change the path in `Hero.jsx`:
   `<img src="/profile.jpg" ... />`

## Adding project screenshots

In `components/Projects.jsx`, each project has an `image` field, set
to `null` by default (which shows a gradient placeholder instead).
To use a real screenshot:

1. Put the image in `public/` (e.g. `public/projects/zands.jpg`).
2. Set `image: "/projects/zands.jpg"` on that project.

## Running it

```bash
npm install
npm run dev      # if using Vite
# or
npm start         # if using Create React App
```

No extra npm packages are required — everything runs on plain CSS and
browser APIs (IntersectionObserver, requestAnimationFrame).

## Design notes — "Aurora Glass"

- **Background**: deep navy (`#0a0d17`) with two slow-drifting
  gradient blobs (violet + cyan), defined in `App.jsx`'s `.aurora` div.
- **Glass cards**: frosted panels using `backdrop-filter: blur` — the
  `.glass` class in `index.css`.
- **3D tilt**: Project cards tilt toward the cursor and glow follows
  the mouse — see `hooks/useTilt.js`.
- **Animated counters**: the About stats count up from 0 when
  scrolled into view — `hooks/useCountUp.js`.
- **Skill bars**: each skill card fills its progress bar on scroll.
- **Marquee**: an auto-scrolling tech-stack strip under the hero.

## Customizing

- **Colors**: `index.css` → `:root` variables (`--bg`, `--violet`, `--cyan`).
- **Skills & levels**: `components/Skills.jsx` → `skills` array.
- **Projects**: `components/Projects.jsx` → `projects` array.
- **Contact links**: `components/Contact.jsx` and `Footer.jsx`.
