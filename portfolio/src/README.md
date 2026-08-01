# Animated Portfolio (React) — Claymorphism Dark Theme

## Files kahan lagane hain?

Apne React project ke `src/` folder ke andar in files ko exactly isi
structure ke saath copy/paste kar dein (agar `App.jsx` / `index.css`
pehle se hai to overwrite kar dein):

```
src/
├── App.jsx
├── index.css
├── hooks/
│   └── useScrollReveal.js
└── components/
    ├── Navbar.jsx / Navbar.css
    ├── Hero.jsx / Hero.css
    ├── About.jsx / About.css
    ├── Skills.jsx / Skills.css
    ├── Projects.jsx / Projects.css
    ├── Contact.jsx / Contact.css
    └── Footer.jsx / Footer.css
```

## Kaise chalayen

```bash
npm install
npm run dev      # Vite hai to
# ya
npm start         # Create React App hai to
```

Koi extra npm package ki zaroorat nahi — sab kuch plain CSS aur
browser ke IntersectionObserver API se ban raha hai.

## Design kaisa hai

**Claymorphism, dark background par** — cards "clay" (mitti/plasticine)
jaise puffy aur 3D lagte hain, kyunke unpe thick soft shadow aur halki
inner highlight dono lagi hui hain. Background dark navy hai (`#1b1e2b`)
aur accent color soft purple (`#8b7cf6`).

- Sab colors `index.css` ke `:root` variables me hain (`--bg`, `--surface`, `--accent`).
- `.clay` class = uthi hui puffy surface (cards, avatar, buttons)
- `.clay-inset` class = dabi hui surface (form inputs)

## Customize karna

- **Naam**: `Navbar.jsx`, `Hero.jsx`, `Footer.jsx` me "Usman Qasim".
- **Skills**: `components/Skills.jsx` ka `skills` array.
- **Projects**: `components/Projects.jsx` ka `projects` array.
- **Contact form**: `components/Contact.jsx` me apna backend/EmailJS laga sakte ho.
