# Usman Qasim — Portfolio + CMS

A Next.js portfolio with a private admin dashboard at `/admin`. Every piece of
content (profile, projects, services, skills, settings, contact messages) is
managed there, and GitHub repositories can be imported as projects with their
README screenshots and features.

- **Site**: Next.js 16 (App Router). Pages are server-rendered with cached content,
  so they're fast and Google and link previews see real titles and images. Each
  project gets its own page at `/projects/<slug>`.
- **Admin**: a client-side app (`react-router` + `@supabase/supabase-js`), loaded
  only on `/admin`.
- **Backend**: [Supabase](https://supabase.com) free tier: Postgres with Row Level
  Security, Auth, Storage, Edge Functions and pg_cron.
- **Hosting**: [Vercel](https://vercel.com). A custom domain can be added at any time.

## Project structure

```text
portfolio/
├── src/
│   ├── app/                    Next.js routes
│   │   ├── layout.jsx          <html>, fonts, theme script, site metadata
│   │   ├── fonts.js            self-hosted fonts (next/font)
│   │   ├── (site)/             public pages: /, /projects, /projects/[slug]
│   │   ├── admin/[[...path]]/  the dashboard (client-only)
│   │   └── api/revalidate/     refreshes cached pages after an admin save
│   ├── views/                  page bodies: HomePage, ProjectsPage, ProjectPage
│   ├── components/             site sections, one .jsx + .css each
│   │   └── projects/           showcase, cards, live preview, category tabs
│   ├── context/                theme + content providers
│   ├── data/defaults.js        built-in content: seed + fallback when offline
│   ├── hooks/                  scroll reveal, count-up, typewriter, active section
│   ├── lib/                    content loading, metadata, safe URLs, text format
│   ├── admin/                  dashboard: pages, components/{ui,form,project}, lib
│   └── index.css               design tokens, typography, shared utilities
├── supabase/
│   ├── migrations/             schema, RLS, storage, GitHub details, cron
│   ├── functions/_shared/      plain-JS logic (GitHub sync, README parser, contact)
│   ├── functions/contact-submit/
│   ├── functions/github-sync/
│   ├── functions/project-screenshot/
│   └── config.toml             local stack (ports 643xx, sign-ups disabled)
├── scripts/                    seed content, create admin
└── tests/
    ├── unit/                   pure logic, no services needed
    └── integration/            RLS, functions and sync against local Supabase
```

## Local development

Requirements: Node 22+ and Docker Desktop running.

```bash
npm install
npm run db:start                # local Supabase; prints URL + keys
cp .env.example .env.local      # paste NEXT_PUBLIC_SUPABASE_URL + PUBLISHABLE_KEY
cp .env.scripts.example .env.scripts.local    # paste SUPABASE_URL + SECRET_KEY
cp supabase/functions/.env.example supabase/functions/.env   # CRON_SECRET, IP_HASH_SALT
npm run db:seed                 # copies src/data/defaults.js into the database
npm run admin:create -- you@example.com      # asks for a password
npm run dev                     # http://localhost:3000 and /admin
```

If port 3000 is busy, run `npm run dev -- -p 3100`. The local Supabase API is
at `http://127.0.0.1:64321` and Studio at `http://127.0.0.1:64323`. The ports are
moved from Supabase's default 543xx because Windows reserves that range on this
machine.

Without `.env.local` the site still builds and runs from `src/data/defaults.js`,
and the contact form falls back to opening the visitor's mail app.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (no services needed) |
| `npm run test:integration` | Integration tests against the local stack |
| `npm run db:start` / `db:stop` | Local Supabase |
| `npm run db:reset` | Recreate the local database and re-seed it |
| `npm run db:seed` | Seed empty tables. `-- --force` also overwrites profile + settings |
| `npm run admin:create -- email` | Create an admin, or promote an existing user |

## Environment variables

| Where | Name | Notes |
| --- | --- | --- |
| `.env.local` and Vercel | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public; sent to the browser. |
| Vercel (optional) | `REVALIDATE_SECRET` | Server-only. Same value as the function secret below, so a GitHub sync can refresh the site immediately. |
| Vercel (optional) | `NEXT_PUBLIC_SITE_URL` | Your domain, e.g. `https://usmanqasim.dev`, for absolute preview-image links. Defaults to the Vercel URL. |
| `.env.scripts.local` | `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Secret. Bypasses RLS. Only for `scripts/` and tests. |
| Edge Function secrets | `GITHUB_TOKEN` | Optional, read-only. Raises GitHub's limit from 60 to 5,000 requests/hour. |
| Edge Function secrets | `SCREENSHOT_API_KEY`, `SCREENSHOT_URL_TEMPLATE` | Optional. Website screenshots use Microlink's free tier (about 50 a day) unless you set these. |
| Edge Function secrets | `CRON_SECRET` | Shared secret between pg_cron and `github-sync`. |
| Edge Function secrets | `IP_HASH_SALT` | Salt for hashing contact-form IPs. |
| Edge Function secrets | `ALLOWED_ORIGINS` | Comma-separated site origins allowed to call the functions. |
| Edge Function secrets | `SITE_REVALIDATE_URL`, `REVALIDATE_SECRET` | Optional. `https://<site>/api/revalidate` and the shared secret. |
| Edge Function secrets | `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM` | Optional. Emails you each new contact message ([Resend](https://resend.com), free tier). Reply goes straight to the visitor. |

All `*.local` files and `supabase/functions/.env` are git-ignored. Never commit them.

## Production deployment

### 1. Supabase (once)

1. Create a project on the free tier.
2. Apply the schema:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

3. In Dashboard → Authentication: turn **off** "Allow new users to sign up", keep
   the **Email** provider on, and set the Site URL to your Vercel URL.
4. Set function secrets, then deploy the functions:

   ```bash
   npx supabase secrets set CRON_SECRET=<random> IP_HASH_SALT=<random> \
     ALLOWED_ORIGINS=https://<your-app>.vercel.app \
     GITHUB_TOKEN=<optional fine-grained read-only token> \
     RESEND_API_KEY=<from resend.com> NOTIFY_EMAIL=<your email>
   npx supabase functions deploy contact-submit
   npx supabase functions deploy github-sync
   npx supabase functions deploy project-screenshot
   ```

5. Scheduled GitHub sync. In the SQL editor, run:

   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
   select vault.create_secret('<same CRON_SECRET as above>', 'cron_secret');
   ```

6. Content and your admin account. Point `.env.scripts.local` at the project
   (URL + secret key from Project Settings → API Keys), then run:

   ```bash
   npm run db:seed
   npm run admin:create -- you@example.com
   ```

### 2. Vercel (once)

1. On vercel.com, choose **Add New → Project** and import `Usman552/React` from GitHub.
2. Set **Root Directory** to `portfolio`. The framework is detected as Next.js.
3. Add the environment variables `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, then deploy.
4. Add the Vercel URL to Supabase `ALLOWED_ORIGINS` and the Auth Site URL.

After this, every push to `main` deploys automatically, and GitHub Actions runs
lint, unit tests and a build on pull requests. Content edits in `/admin` go live on
the next page load; no deploy is needed.

### 3. Custom domain (later)

In Vercel → Project → Settings → Domains, add the domain and set the DNS records
Vercel shows at your registrar. Then update `NEXT_PUBLIC_SITE_URL`,
`ALLOWED_ORIGINS` and the Supabase Site URL to the new domain.

## How it works

### Content and caching
The server loads all public content with one request (`get_public_content()`).
That function runs with the visitor's permissions, so RLS hides drafts and hidden
items. Pages are cached and refreshed every 5 minutes. When an admin saves
something, the dashboard calls `/api/revalidate`. That route checks the admin's
session and expires the cache immediately, so the change shows on the next visit.

Editable text accepts `*highlight*` (rendered in the italic serif with the
gradient), `**bold**` and line breaks. HTML is never parsed. Every URL passes an
allow-list (`http(s)`, `mailto:`, `/path`, `#anchor`) in the browser, on the
server and in a database `CHECK`.

### Projects, categories and demos
- The home page shows the projects marked **Show on homepage** as large
  showcases. Settings → *Projects on the home page* sets how many.
- `/projects` lists every published project, with category tabs. Links like
  `/projects?category=3D%20Websites` can be shared.
- Categories describe the kind of site: 3D Websites, E-commerce, Business Websites,
  Web Apps & Dashboards and AI & ML. You can also type any other category.
- Each project page has a live demo preview in a browser frame, which loads only
  when clicked, plus features, screenshots and a share preview image.
- "Code" buttons and the GitHub link are off by default (Settings → Projects
  display). The portfolio shows demos, not source code.

### GitHub: push a repo, it shows on the portfolio
- Sync runs every 15 minutes (and on **Sync now**). It fetches your public
  repositories and, for those with new pushes, their README (from
  raw.githubusercontent.com, which doesn't use the API quota) and languages.
  From the README it reads the title, summary, features, tech stack (lists,
  tables and badges), live demo link and screenshots (badges and SVG icons are
  skipped, relative paths are resolved).
- **Auto-publish** (Admin → GitHub) decides which new repositories go live on
  their own: *complete READMEs* (description + screenshots + features, the
  default), *any repository with a description*, or *off*. New ones appear at the
  top of your work. The repository table shows what each README still needs.
- Auto-published projects follow their README (**Keep in sync with the README**
  in the project editor). Turn that off to keep your own edits. Manually
  imported projects start as drafts with it off.
- Delete a project and its repository is **dismissed**: sync never brings it
  back. Importing it by hand undoes that.
- If `SITE_REVALIDATE_URL` and `REVALIDATE_SECRET` are set, the site refreshes
  the moment a sync publishes something; otherwise within 5 minutes.
- Repositories that disappear are flagged `missing`, and archived ones
  `archived`. Nothing is deleted or unpublished automatically. If GitHub's rate
  limit is hit, the sync says so and finishes the remaining READMEs on the next
  run.

### Admin studio

- **Overview**: animated KPIs, a portfolio health score (each failed check links to its fix), inbox, latest projects, GitHub languages and activity.
- **Theme**: the admin has its own light/dark/system switch in the top bar. The public site's default theme, whether visitors can switch, and the brand colour are set in Settings → Appearance.
- **Experience**: work, education and certifications, shown as a timeline once at least one entry is visible.
- **Skills from GitHub**: Admin → Skills lists technologies found in synced repositories that are not skills yet. Nothing is added until you approve it; dismissed ones stay hidden.
- **Media library**: every stored file, where it is used, and safe delete. Covers can be filled with a screenshot of the live demo (`project-screenshot` function).
- **Command palette**: `Ctrl/⌘ + K` jumps to any page or action.

### Getting hired
- Every contact-form message is saved in **Admin → Messages**, with an unread
  badge. If `RESEND_API_KEY` and `NOTIFY_EMAIL` are set, you also get an email.
  Its Reply-To is the visitor, so replying from your inbox answers them.
- Add a **WhatsApp** link (`https://wa.me/923001234567`, country code + number,
  no `+` or leading 0) under Admin → Profile → Social profiles for a floating
  "Chat on WhatsApp" button on every page, with a greeting already typed.
- Add your **Upwork** or **Fiverr** profile under Admin → Profile → Social
  profiles. The site recognises them and shows "Hire me on Upwork" and "Order on
  Fiverr" buttons in the hero, the contact section and the footer call to action.

### Security
- Sign-up is disabled. Admins exist only through `npm run admin:create`.
- Visitors can read only published rows. Messages, GitHub data and sync settings
  are admin-only. Messages are inserted only by the `contact-submit` function.
- Contact form: server-side validation, a honeypot field, a minimum fill time, and
  rate limits of 3 per IP per hour and 60 per hour overall. IPs are stored only as
  salted SHA-256 hashes.
- Uploads: images and PDF only (no SVG), at most 10 MB, admin-only writes.
- Security headers come from `next.config.mjs`. `/admin` is `noindex`.

## Tests

```bash
npm test                    # 54 unit tests: README parser, sync, auto-publish, email, validation, URL/text safety
npm run test:integration    # 34 tests against local Supabase (needs db:start + env files)
```

The integration tests create throwaway users and fixtures and remove them
afterwards. They restore any rows they change.

## Known limitations

- Vercel's free Hobby plan is meant for personal, non-commercial sites. A
  portfolio fits; switch to Pro if the site becomes commercial.
- Some demo sites refuse to be shown inside a frame. Their preview stays blank, and
  the "Open in new tab" link still works.
- Replacing an image doesn't delete the old file from Storage.
- Password reset needs SMTP configured in Supabase. Until then, reset the
  password from the Supabase dashboard.
