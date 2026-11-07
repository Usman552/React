import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { discoverSkills, SKILL_GROUPS } from "../../../supabase/functions/_shared/skills.js";
import { mainLanguages } from "../../../supabase/functions/_shared/github.js";
import { coverGradients } from "../../data/site";
import Icon from "../components/Icon";
import { Badge, Card, ErrorState, Skeleton } from "../components/ui";
import useCountUp from "../hooks/useCountUp";
import useLoad from "../hooks/useLoad";
import { api } from "../lib/api";
import { plural, timeAgo } from "../lib/format";
import { formatBytes } from "../lib/media";
import { supabase } from "../lib/supabase";

const REPO_COLUMNS = "id, name, readme_title, state, language, languages, topics, readme_tech, readme_topics";

async function loadDashboard() {
  const [overview, profile, projects, messages, repos, skills, dismissed] = await Promise.all([
    api.overview(),
    supabase.from("profile").select("name").eq("id", 1).maybeSingle(),
    supabase
      .from("projects")
      .select("id, title, status, category, thumbnail_url, cover, featured, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("contact_messages")
      .select("id, name, email, message, status, created_at")
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("github_repos").select(REPO_COLUMNS),
    supabase.from("skills").select("name"),
    supabase.from("skill_suggestion_dismissals").select("key"),
  ]);
  const failed = [profile, projects, messages, repos, skills, dismissed].find((r) => r.error);
  if (failed) throw failed.error;
  return {
    ...overview,
    name: profile.data?.name || "",
    projects: projects.data,
    messages: messages.data,
    repos: repos.data,
    suggestions: discoverSkills({ repos: repos.data, skills: skills.data, dismissed: dismissed.data }),
  };
}

const ACTIVITY = {
  project: { icon: "folder", to: (id) => `/admin/projects/${id}` },
  service: { icon: "layers", to: () => "/admin/services" },
  skill: { icon: "sparkles", to: () => "/admin/skills" },
  experience: { icon: "briefcase", to: () => "/admin/experience" },
  profile: { icon: "user", to: () => "/admin/profile" },
  settings: { icon: "settings", to: () => "/admin/settings" },
};

const SYNC_TONES = { success: "success", error: "danger", running: "info", idle: "neutral" };

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** The checklist behind the health score. Each item links to where it's fixed. */
function healthChecks(d) {
  const h = d.health || {};
  return [
    { ok: h.profile_photo, label: "Profile photo uploaded", to: "/admin/profile" },
    { ok: h.bio, label: "Biography written", to: "/admin/profile" },
    { ok: h.resume, label: "Resume attached", to: "/admin/profile" },
    { ok: h.socials >= 2, label: "Two or more social profiles", to: "/admin/profile" },
    { ok: h.seo_description, label: "SEO description set", to: "/admin/settings" },
    { ok: h.og_image, label: "Social sharing image set", to: "/admin/settings" },
    {
      ok: d.projects_published > 0 && h.published_without_cover === 0,
      label: h.published_without_cover
        ? `${plural(h.published_without_cover, "live project")} without a cover`
        : "Every live project has a cover",
      to: "/admin/projects",
    },
    { ok: d.experience_total > 0, label: "Experience timeline started", to: "/admin/experience" },
    { ok: Boolean(d.github?.enabled), label: "GitHub connected", to: "/admin/github" },
    {
      ok: d.messages_unread === 0,
      label: d.messages_unread ? `${plural(d.messages_unread, "unread message")}` : "Inbox zero",
      to: "/admin/messages",
    },
  ];
}

function Kpi({ to, icon, tone, label, value, foot, ratio, i }) {
  const shown = useCountUp(value);
  return (
    <Link to={to} className="kpi span-3" style={{ "--tone": tone, "--i": i }}>
      <span className="kpi__top">
        <span className="kpi__icon">
          <Icon name={icon} size={17} />
        </span>
        <Icon name="arrowUpRight" size={16} className="kpi__arrow" />
      </span>
      <span>
        <span className="kpi__label">{label}</span>
        <span className="kpi__value" style={{ display: "block", marginTop: 6 }}>
          {shown}
        </span>
      </span>
      {ratio != null && (
        <span className="kpi__bar" aria-hidden="true">
          <span style={{ width: `${Math.round(ratio * 100)}%` }} />
        </span>
      )}
      <span className="kpi__foot">{foot}</span>
    </Link>
  );
}

function HealthRing({ score }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  const shown = useCountUp(score, 1200);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOffset(circumference * (1 - score / 100)));
    return () => cancelAnimationFrame(frame);
  }, [score, circumference]);

  return (
    <div className="ring" role="img" aria-label={`Portfolio health ${score} out of 100`}>
      <svg viewBox="0 0 132 132">
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--a-primary)" />
            <stop offset="100%" stopColor="var(--a-accent)" />
          </linearGradient>
        </defs>
        <circle className="ring__track" cx="66" cy="66" r={radius} fill="none" strokeWidth="10" />
        <circle
          className="ring__value"
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="ring__label" aria-hidden="true">
        <strong>{shown}</strong>
        <span>of 100</span>
      </span>
    </div>
  );
}

/** Horizontal bars for one measure: a single hue, every value labelled. */
function Bars({ rows, format = (v) => v }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="bars">
      {rows.map((row, i) => (
        <li key={row.label} title={`${row.label}: ${format(row.value)}`}>
          <span className="bars__head">
            <span className="bars__name">{row.label}</span>
            <span className="bars__value">{format(row.value)}</span>
          </span>
          <span className="bars__track" aria-hidden="true">
            <span className="bars__fill" style={{ width: `${(row.value / max) * 100}%`, "--i": i }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ d }) {
  const checks = healthChecks(d);
  const done = checks.filter((c) => c.ok).length;
  const score = Math.round((done / checks.length) * 100);
  const firstName = d.name.split(" ")[0];
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const categories = useMemo(() => {
    const counts = new Map();
    for (const p of d.projects) counts.set(p.category, (counts.get(p.category) || 0) + 1);
    return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [d.projects]);

  const languages = useMemo(() => {
    const bytes = new Map();
    for (const r of d.repos) {
      if (r.state === "missing") continue;
      for (const name of mainLanguages(r.languages)) bytes.set(name, (bytes.get(name) || 0) + Number(r.languages[name]));
    }
    const total = [...bytes.values()].reduce((a, b) => a + b, 0);
    return [...bytes]
      .map(([label, value]) => ({ label, value: total ? Math.round((value / total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [d.repos]);

  const latest = d.projects.slice(0, 4);

  return (
    <div className="dash">
      {/* Hero */}
      <section className="hero span-12" style={{ "--i": 0 }}>
        <div className="hero__mesh" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="hero__grid" aria-hidden="true" />
        <div>
          <p className="hero__date">
            <span className="hero__live" aria-hidden="true" /> {today} · portfolio is live
          </p>
          <h1 className="hero__title">
            {greeting()}
            {firstName && (
              <>
                , <em>{firstName}</em>
              </>
            )}
            .
          </h1>
          <p className="hero__text">
            {d.messages_unread
              ? `You have ${plural(d.messages_unread, "unread message")} waiting. `
              : "Your inbox is clear. "}
            {score === 100 ? "Your portfolio is in perfect shape." : `Portfolio health is at ${score}%. A few quick wins below.`}
          </p>
        </div>
        <div className="hero__actions">
          <Link to="/admin/projects/new" className="a-btn a-btn--primary">
            <Icon name="plus" size={16} /> New project
          </Link>
          <Link to="/admin/experience?new=1" className="a-btn a-btn--ghost">
            <Icon name="briefcase" size={16} /> Add experience
          </Link>
          <a href="/" target="_blank" rel="noreferrer" className="a-btn a-btn--ghost">
            <Icon name="external" size={16} /> View site
          </a>
        </div>
      </section>

      {/* KPIs */}
      <Kpi
        i={1}
        to="/admin/projects"
        icon="folder"
        tone="var(--a-primary)"
        label="Projects"
        value={d.projects_total}
        ratio={d.projects_total ? d.projects_published / d.projects_total : 0}
        foot={
          <>
            <span>{d.projects_published} live</span>
            <span>{d.projects_draft} drafts</span>
          </>
        }
      />
      <Kpi
        i={2}
        to="/admin/messages"
        icon="inbox"
        tone="var(--a-info)"
        label="Unread messages"
        value={d.messages_unread}
        ratio={d.messages_total ? d.messages_unread / d.messages_total : 0}
        foot={
          <>
            <span>{d.messages_week} this week</span>
            <span>{d.messages_total} total</span>
          </>
        }
      />
      <Kpi
        i={3}
        to="/admin/skills"
        icon="sparkles"
        tone="var(--a-success)"
        label="Skills"
        value={d.skills_total}
        foot={
          <>
            <span>{plural(d.skill_categories_total, "category", "categories")}</span>
            {d.suggestions.length > 0 && <span className="text-success">+{d.suggestions.length} found</span>}
          </>
        }
      />
      <Kpi
        i={4}
        to="/admin/media"
        icon="image"
        tone="var(--a-warn)"
        label="Media files"
        value={d.media_total}
        foot={
          <>
            <span>{formatBytes(d.media_bytes)} stored</span>
            <span>Library</span>
          </>
        }
      />

      {/* Health */}
      <Card
        className="span-7 widget"
        style={{ "--i": 5 }}
        title={
          <>
            <Icon name="activity" size={16} /> Portfolio health
          </>
        }
        description={`${done} of ${checks.length} checks passed. Click any item to fix it.`}
      >
        <div className="health">
          <HealthRing score={score} />
          <ul className="checklist">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? "is-done" : ""}>
                <Link to={c.to}>
                  <span className={`checklist__icon checklist__icon--${c.ok ? "ok" : "todo"}`}>
                    <Icon name={c.ok ? "check" : "alert"} size={12} />
                  </span>
                  <span>{c.label}</span>
                  <span className="sr-only">{c.ok ? "(done)" : "(to do)"}</span>
                  {!c.ok && <Icon name="chevronRight" size={14} className="checklist__go" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Inbox */}
      <Card
        className="span-5 widget"
        style={{ "--i": 6 }}
        title={
          <>
            <Icon name="inbox" size={16} /> Inbox
            {d.messages_unread > 0 && <Badge tone="info">{d.messages_unread} new</Badge>}
          </>
        }
        actions={
          <Link to="/admin/messages" className="a-btn a-btn--ghost a-btn--sm">
            Open
          </Link>
        }
      >
        {d.messages.length === 0 ? (
          <p className="muted">No messages yet. Enquiries from your contact form land here.</p>
        ) : (
          <ul className="mini-list">
            {d.messages.map((m) => (
              <li key={m.id}>
                <Link to="/admin/messages" className="mini-row">
                  <span className={`avatar ${m.status === "unread" ? "is-unread" : ""}`} aria-hidden="true">
                    {m.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="mini-row__main">
                    <span className="mini-row__title">
                      {m.name}
                      {m.status === "unread" && <span className="sr-only"> (unread)</span>}
                    </span>
                    <span className="mini-row__sub">{m.message}</span>
                  </span>
                  <span className="mini-row__time">{timeAgo(m.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <dl className="stat-row">
          <div>
            <dt>Unread</dt>
            <dd>{d.messages_unread}</dd>
          </div>
          <div>
            <dt>This week</dt>
            <dd>{d.messages_week}</dd>
          </div>
          <div>
            <dt>All time</dt>
            <dd>{d.messages_total}</dd>
          </div>
        </dl>
      </Card>

      {/* Latest projects */}
      <Card
        className="span-8 widget"
        style={{ "--i": 7 }}
        title={
          <>
            <Icon name="folder" size={16} /> Latest projects
          </>
        }
        actions={
          <Link to="/admin/projects" className="a-btn a-btn--ghost a-btn--sm">
            All projects
          </Link>
        }
      >
        {latest.length === 0 ? (
          <p className="muted">No projects yet. Create one or import from GitHub.</p>
        ) : (
          <div className="shots">
            {latest.map((p) => (
              <Link key={p.id} to={`/admin/projects/${p.id}`} className="shot">
                <span className="shot__img" style={{ background: p.thumbnail_url ? undefined : coverGradients[p.cover] }}>
                  {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" loading="lazy" /> : p.title.slice(0, 1)}
                  <Badge tone={p.status === "published" ? "success" : "neutral"}>{p.status === "published" ? "Live" : "Draft"}</Badge>
                </span>
                <span className="shot__title">{p.title}</span>
                <span className="shot__sub">Updated {timeAgo(p.updated_at)}</span>
              </Link>
            ))}
          </div>
        )}
        <dl className="stat-row">
          <div>
            <dt>Live</dt>
            <dd>{d.projects_published}</dd>
          </div>
          <div>
            <dt>Drafts</dt>
            <dd>{d.projects_draft}</dd>
          </div>
          <div>
            <dt>Featured</dt>
            <dd>{d.projects.filter((p) => p.featured).length}</dd>
          </div>
          <div>
            <dt>Services</dt>
            <dd>{d.services_published}</dd>
          </div>
          <div>
            <dt>Timeline</dt>
            <dd>{d.experience_total}</dd>
          </div>
        </dl>
      </Card>

      {/* GitHub */}
      <Card
        className="span-4 widget"
        style={{ "--i": 8 }}
        title={
          <>
            <Icon name="github" size={16} /> GitHub
          </>
        }
        actions={
          d.github?.username ? (
            <Badge tone={d.github.enabled ? SYNC_TONES[d.github.last_status] : "neutral"}>
              {d.github.enabled ? d.github.last_status : "disabled"}
            </Badge>
          ) : null
        }
      >
        {!d.github?.username ? (
          <>
            <p className="muted">Connect your GitHub account to import repositories and discover skills.</p>
            <Link to="/admin/github" className="a-btn a-btn--soft a-btn--sm" style={{ alignSelf: "flex-start" }}>
              Connect GitHub
            </Link>
          </>
        ) : (
          <>
            <dl className="stat-pair">
              <div>
                <dt>Repositories</dt>
                <dd>{d.repos_total}</dd>
              </div>
              <div>
                <dt>Last sync</dt>
                <dd style={{ fontSize: 15, paddingTop: 4 }}>{timeAgo(d.github.last_success_at)}</dd>
              </div>
            </dl>
            {languages.length > 0 && (
              <div>
                <p className="small muted" style={{ marginBottom: 10 }}>
                  Languages by code size, @{d.github.username}
                </p>
                <Bars rows={languages} format={(v) => `${v}%`} />
              </div>
            )}
            {d.github.last_status === "error" && d.github.last_error && (
              <p className="notice notice--danger">{d.github.last_error}</p>
            )}
          </>
        )}
      </Card>

      {/* Content mix */}
      <Card
        className="span-4 widget"
        style={{ "--i": 9 }}
        title={
          <>
            <Icon name="layers" size={16} /> Projects by category
          </>
        }
      >
        {categories.length ? <Bars rows={categories} /> : <p className="muted">Categories appear once you add projects.</p>}
      </Card>

      {/* Skill suggestions */}
      <Card
        className="span-4 widget"
        style={{ "--i": 10 }}
        title={
          <>
            <Icon name="wand" size={16} /> Found on GitHub
          </>
        }
        actions={
          d.suggestions.length > 0 && (
            <Link to="/admin/skills" className="a-btn a-btn--soft a-btn--sm">
              Review
            </Link>
          )
        }
      >
        {d.suggestions.length === 0 ? (
          <p className="muted">
            {d.repos.length ? "Your skills cover every technology in your repositories." : "Sync GitHub to discover the skills you use."}
          </p>
        ) : (
          <>
            <p className="muted small">
              {plural(d.suggestions.length, "technology", "technologies")} you use that aren&apos;t on your skills list.
            </p>
            <div className="chips">
              {d.suggestions.slice(0, 10).map((s, idx) => (
                <span key={s.key} className="chip" style={{ "--i": idx }} title={`${SKILL_GROUPS[s.group]?.label} · ${plural(s.count, "repo")}`}>
                  {s.name} <small>{s.count}</small>
                </span>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Activity */}
      <Card
        className="span-4 widget"
        style={{ "--i": 11 }}
        title={
          <>
            <Icon name="clock" size={16} /> Recent activity
          </>
        }
      >
        {d.recent.length === 0 ? (
          <p className="muted">Nothing edited yet.</p>
        ) : (
          <ul className="activity">
            {d.recent.map((item) => {
              const kind = ACTIVITY[item.kind] || ACTIVITY.settings;
              return (
                <li key={`${item.kind}-${item.id}`}>
                  <Link to={kind.to(item.id)}>
                    <span className="activity__dot" aria-hidden="true">
                      <Icon name={kind.icon} size={13} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="activity__label" style={{ display: "block" }}>
                        {item.label}
                      </span>
                      {item.label.toLowerCase() !== item.kind && <span className="activity__kind">{item.kind}</span>}
                    </span>
                    <span className="mini-row__time">{timeAgo(item.updated_at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function OverviewPage() {
  const { data, loading, error, reload } = useLoad(loadDashboard);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) {
    return (
      <div className="dash">
        <div className="hero span-12">
          <Skeleton lines={3} height={18} />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="kpi span-3">
            <Skeleton lines={3} />
          </div>
        ))}
        <div className="card span-7">
          <Skeleton lines={6} />
        </div>
        <div className="card span-5">
          <Skeleton lines={6} />
        </div>
      </div>
    );
  }
  return <Dashboard d={data} />;
}
