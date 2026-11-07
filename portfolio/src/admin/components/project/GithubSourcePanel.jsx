import { repoToProject } from "../../../../supabase/functions/_shared/github.js";
import { formatDateTime } from "../../lib/format";
import { Badge, Card } from "../ui";

const STATE_NOTES = {
  missing: "GitHub no longer returns this repository (deleted, renamed away, or made private). The project stays as it is.",
  archived: "This repository is archived on GitHub.",
};

function list(items) {
  return items.length ? items.join(", ") : "—";
}

/**
 * Latest data from GitHub for an imported project. Sync keeps this up to
 * date without touching the project; "Use" copies a value into the form.
 */
export default function GithubSourcePanel({ repo, onUse }) {
  if (!repo) {
    return (
      <Card title="GitHub" className="card--warn">
        <p className="muted">The linked repository is no longer in the sync data. Your project is unchanged.</p>
      </Card>
    );
  }

  // Same mapping the importer uses, so "Use" gives exactly what a fresh import would.
  const suggested = repoToProject(repo, { sortOrder: 0, slug: "" });
  const screenshots = [suggested.thumbnail_url, ...suggested.gallery.map((g) => g.url)].filter(Boolean);

  const rows = [
    { label: "Title", value: suggested.title, apply: { title: suggested.title } },
    { label: "Summary", value: suggested.summary || "—", apply: suggested.summary && { summary: suggested.summary } },
    { label: "Category", value: suggested.category, apply: { category: suggested.category } },
    {
      label: "Screenshots",
      value: screenshots.length ? (
        <span className="shot-strip">
          {screenshots.map((url) => (
            <img key={url} src={url} alt="" loading="lazy" />
          ))}
        </span>
      ) : (
        "None found in README"
      ),
      apply: screenshots.length && { thumbnail_url: suggested.thumbnail_url, gallery: suggested.gallery },
    },
    {
      label: "Features",
      value: suggested.features.length ? `${suggested.features.length} from README` : "—",
      apply: suggested.features.length && { features: suggested.features },
    },
    { label: "Tech", value: list(suggested.tech), apply: suggested.tech.length && { tech: suggested.tech } },
    { label: "Tags", value: list(suggested.tags), apply: suggested.tags.length && { tags: suggested.tags } },
    { label: "Live demo", value: suggested.demo_url || "—", apply: suggested.demo_url && { demo_url: suggested.demo_url } },
    { label: "Repository", value: repo.html_url, apply: { repo_url: repo.html_url } },
  ];

  const everything = Object.assign({}, ...rows.map((row) => row.apply || {}));

  return (
    <Card
      title="GitHub source"
      description="Sync keeps this current but never edits your project. Use a value to copy it in, then save."
      actions={<Badge tone={repo.state === "active" ? "success" : "warn"}>{repo.state}</Badge>}
    >
      {STATE_NOTES[repo.state] && <p className="notice notice--warn">{STATE_NOTES[repo.state]}</p>}
      {repo.details_error && (
        <p className="notice">README details couldn't be refreshed on the last sync: {repo.details_error}</p>
      )}

      <dl className="kv kv--actions">
        {rows.map((row) => (
          <div key={row.label} className="kv__row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            <dd>
              {row.apply ? (
                <button type="button" className="a-btn a-btn--ghost a-btn--xs" onClick={() => onUse(row.apply)}>
                  Use
                </button>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="inline-actions">
        <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onUse(everything)}>
          Use all from GitHub
        </button>
      </div>
      <p className="muted small">
        ★ {repo.stargazers} · last push {formatDateTime(repo.pushed_at)}
      </p>
    </Card>
  );
}
