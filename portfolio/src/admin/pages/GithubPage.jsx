import { useMemo, useState } from "react";
import { Link } from "react-router";
import { SelectField, TextField, Toggle } from "../components/form";
import { missingForAutoPublish } from "../../../supabase/functions/_shared/github.js";
import Icon from "../components/Icon";
import { Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui";
import { useConfirm, useToast } from "../context/hooks";
import useLoad from "../hooks/useLoad";
import { describeError, invokeFunction } from "../lib/errors";
import { formatDateTime, plural, timeAgo } from "../lib/format";
import { supabase } from "../lib/supabase";

const STATUS_TONES = { success: "success", error: "danger", running: "info", idle: "neutral" };
const STATE_TONES = { active: "success", archived: "warn", missing: "danger" };
const USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

async function loadGithub() {
  const [config, repos, projects] = await Promise.all([
    supabase.from("github_sync").select("*").eq("id", 1).single(),
    supabase.from("github_repos").select("*").order("pushed_at", { ascending: false, nullsFirst: false }),
    supabase.from("projects").select("id, title, status, github_repo_id").not("github_repo_id", "is", null),
  ]);
  const failed = [config, repos, projects].find((r) => r.error);
  if (failed) throw failed.error;
  return { config: config.data, repos: repos.data, projects: projects.data };
}

function SetupGuide() {
  return (
    <Card title="How GitHub sync works" className="card--muted">
      <ol className="steps">
        <li>Enter your GitHub username and turn sync on.</li>
        <li>
          Click <strong>Sync now</strong>. Your public repositories are fetched on the server and listed below. Nothing
          is added to your portfolio yet.
        </li>
        <li>
          Select repositories and click <strong>Import as drafts</strong>. Review and edit each draft, then publish it.
        </li>
        <li>
          Later syncs refresh repository metadata only. Your edits to imported projects are never overwritten, and
          deleted or private repositories are flagged, never auto-removed.
        </li>
      </ol>
      <p className="muted small">
        Optional: add a read-only <code>GITHUB_TOKEN</code> Edge Function secret to raise GitHub's rate limit from 60 to
        5,000 requests per hour. The token never reaches the browser.
      </p>
    </Card>
  );
}

const CONFIG_FIELDS = ["username", "enabled", "auto_sync", "include_forks", "auto_publish"];
const pickConfig = (row) => Object.fromEntries(CONFIG_FIELDS.map((key) => [key, row[key]]));

const AUTO_PUBLISH_OPTIONS = [
  { value: "complete", label: "Complete READMEs: description, screenshots and features (recommended)" },
  { value: "described", label: "Any repository with a description" },
  { value: "off", label: "Off: I import projects by hand" },
];

function ConfigCard({ config, onSaved }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [values, setValues] = useState(() => pickConfig(config));
  const [saving, setSaving] = useState(false);
  const usernameError = values.username && !USERNAME_RE.test(values.username) ? "That isn't a valid GitHub username." : null;
  const dirty = CONFIG_FIELDS.some((key) => values[key] !== config[key]);

  const save = async (next = values) => {
    if (next.username && !USERNAME_RE.test(next.username)) return;
    setSaving(true);
    const { data, error } = await supabase.from("github_sync").update(next).eq("id", 1).select().single();
    setSaving(false);
    if (error) {
      toast.error(describeError(error));
      return;
    }
    setValues(pickConfig(data));
    onSaved(data);
    toast.success("Sync settings saved.");
  };

  const disconnect = async () => {
    const ok = await confirm({
      title: "Disconnect GitHub?",
      message: "Sync is turned off. Imported projects and their content stay exactly as they are.",
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (ok) save({ ...values, enabled: false, auto_sync: false });
  };

  return (
    <Card
      title="Connection"
      actions={config.enabled && <Badge tone="success">connected</Badge>}
    >
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <TextField
          label="GitHub username"
          placeholder="Usman552"
          value={values.username}
          onChange={(username) => setValues((v) => ({ ...v, username: username.trim() }))}
          error={usernameError}
          hint="Only public repositories owned by this account are fetched."
        />
        <Toggle
          label="Enable sync"
          checked={values.enabled}
          onChange={(enabled) => setValues((v) => ({ ...v, enabled, auto_sync: enabled ? v.auto_sync : false }))}
        />
        <Toggle
          label="Automatic sync every 15 minutes"
          description="Runs on the server with pg_cron. Requires the cron secrets described in the README."
          checked={values.auto_sync}
          disabled={!values.enabled}
          onChange={(auto_sync) => setValues((v) => ({ ...v, auto_sync }))}
        />
        <SelectField
          label="Auto-publish new repositories"
          hint="Push a repo to GitHub and it appears on your portfolio after the next sync. Deleted projects never come back."
          value={values.auto_publish}
          onChange={(auto_publish) => setValues((v) => ({ ...v, auto_publish }))}
          options={AUTO_PUBLISH_OPTIONS}
        />
        <Toggle
          label="Include forks"
          checked={values.include_forks}
          onChange={(include_forks) => setValues((v) => ({ ...v, include_forks }))}
        />
        <div className="inline-actions">
          <button type="submit" className="a-btn a-btn--primary" disabled={!dirty || saving || Boolean(usernameError)}>
            {saving ? "Saving…" : "Save settings"}
          </button>
          {config.enabled && (
            <button type="button" className="a-btn a-btn--ghost a-btn--danger-text" onClick={disconnect} disabled={saving}>
              Disconnect
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}

function StatusCard({ config, syncing, onSync }) {
  const result = config.last_result;
  return (
    <Card
      title="Sync status"
      actions={
        <button
          type="button"
          className="a-btn a-btn--primary"
          onClick={onSync}
          disabled={syncing || !config.enabled || !config.username}
        >
          <Icon name="refresh" size={16} className={syncing ? "spin" : ""} /> {syncing ? "Syncing…" : "Sync now"}
        </button>
      }
    >
      {!config.enabled && <p className="notice">Sync is disabled. Enable it and save to fetch repositories.</p>}
      <dl className="kv">
        <dt>Status</dt>
        <dd>
          <Badge tone={STATUS_TONES[config.last_status]}>{config.last_status}</Badge>
        </dd>
        <dt>Last run</dt>
        <dd title={formatDateTime(config.last_run_at)}>{timeAgo(config.last_run_at)}</dd>
        <dt>Last success</dt>
        <dd title={formatDateTime(config.last_success_at)}>{timeAgo(config.last_success_at)}</dd>
        {result && (
          <>
            <dt>Last result</dt>
            <dd>
              {plural(result.fetched, "repository", "repositories")} fetched · {result.new} new · {result.updated} updated
              {result.missing > 0 && ` · ${result.missing} missing`}
              {result.skipped_forks > 0 && ` · ${result.skipped_forks} forks skipped`}
              {result.details_refreshed > 0 && ` · ${result.details_refreshed} READMEs read`}
              {result.auto_published > 0 && ` · ${plural(result.auto_published, "project")} auto-published`}
              {result.auto_updated > 0 && ` · ${plural(result.auto_updated, "project")} updated from README`}
            </dd>
          </>
        )}
      </dl>
      {config.last_status === "success" && config.last_error && (
        <p className="notice notice--warn">{config.last_error}</p>
      )}
      {config.last_status === "error" && config.last_error && (
        <p className="notice notice--danger" role="alert">
          {config.last_error}
        </p>
      )}
    </Card>
  );
}

/** Why a repository isn't on the portfolio yet, against the auto-publish rule. */
function Readiness({ repo, rule }) {
  const missing = missingForAutoPublish(repo, rule === "off" ? "complete" : rule);
  if (!missing.length) {
    return <Badge tone="success">{rule === "off" ? "Ready to import" : "Publishes on next sync"}</Badge>;
  }
  return <span className="muted small">README needs: {missing.join(", ")}</span>;
}

function RepoTable({ repos, projects, autoPublish, onImported }) {
  const toast = useToast();
  const [selected, setSelected] = useState(() => new Set());
  const [filter, setFilter] = useState("available");
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);

  const projectByRepo = useMemo(() => new Map(projects.map((p) => [Number(p.github_repo_id), p])), [projects]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter((r) => {
      const linked = projectByRepo.has(Number(r.id));
      const matchesFilter =
        filter === "all" ||
        (filter === "available" && !linked && r.state !== "missing") ||
        (filter === "imported" && linked) ||
        (filter === "flagged" && r.state !== "active");
      return matchesFilter && (!q || `${r.name} ${r.description ?? ""} ${r.language ?? ""}`.toLowerCase().includes(q));
    });
  }, [repos, projectByRepo, filter, query]);

  const selectable = visible.filter((r) => !projectByRepo.has(Number(r.id)) && r.state !== "missing");
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));

  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const importSelected = async () => {
    setImporting(true);
    try {
      const { result } = await invokeFunction(supabase, "github-sync", { action: "import", repoIds: [...selected] });
      toast.success(
        result.imported
          ? `${plural(result.imported, "draft project")} created. Review them before publishing.`
          : "Those repositories were already imported."
      );
      setSelected(new Set());
      onImported();
    } catch (err) {
      toast.error(describeError(err, "Import failed."));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="card card--flush">
      <div className="toolbar">
        <label className="search">
          <Icon name="search" size={16} />
          <span className="sr-only">Search repositories</span>
          <input type="search" placeholder="Search repositories" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="segmented" role="group" aria-label="Filter repositories">
          {[
            ["available", "Not imported"],
            ["imported", "Imported"],
            ["flagged", "Archived / missing"],
            ["all", "All"],
          ].map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} className={filter === key ? "is-active" : ""} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="a-btn a-btn--primary a-btn--sm" disabled={!selected.size || importing} onClick={importSelected}>
          {importing ? "Importing…" : `Import ${selected.size || ""} as drafts`}
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon="github" title="No repositories here" text="Try another filter, or run a sync." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col" className="table__check">
                  <input
                    type="checkbox"
                    aria-label="Select all importable repositories"
                    checked={allSelected}
                    disabled={!selectable.length}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)))
                    }
                  />
                </th>
                <th scope="col">Repository</th>
                <th scope="col">Language</th>
                <th scope="col">Last push</th>
                <th scope="col">State</th>
                <th scope="col">Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const project = projectByRepo.get(Number(r.id));
                const canSelect = !project && r.state !== "missing";
                return (
                  <tr key={r.id} className={selected.has(r.id) ? "is-selected" : ""}>
                    <td className="table__check">
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.name}`}
                        checked={selected.has(r.id)}
                        disabled={!canSelect}
                        onChange={() => toggle(r.id)}
                      />
                    </td>
                    <td>
                      <a href={r.html_url} target="_blank" rel="noreferrer" className="table__title table__title--plain">
                        {r.readme_images?.[0]?.url ? (
                          <img className="repo-shot" src={r.readme_images[0].url} alt="" loading="lazy" />
                        ) : (
                          <span className="repo-shot repo-shot--empty" aria-hidden="true">
                            <Icon name="github" size={16} />
                          </span>
                        )}
                        <span>
                          <strong>
                            {r.readme_title || r.name} {r.is_fork && <Badge>fork</Badge>}
                          </strong>
                          <small>{r.description || r.readme_summary || "No description"}</small>
                          <small>
                            {[
                              r.readme_images?.length && plural(r.readme_images.length, "screenshot"),
                              r.readme_features?.length && plural(r.readme_features.length, "feature"),
                            ]
                              .filter(Boolean)
                              .join(" · ") || "No README details yet"}
                          </small>
                        </span>
                      </a>
                    </td>
                    <td>{r.language || "—"}</td>
                    <td className="muted">{timeAgo(r.pushed_at)}</td>
                    <td>
                      <Badge tone={STATE_TONES[r.state]}>{r.state}</Badge>
                    </td>
                    <td>
                      {project ? (
                        <Link to={`/admin/projects/${project.id}`} className="link">
                          {project.status === "published" ? "Published" : "Draft"} · Edit
                        </Link>
                      ) : r.dismissed ? (
                        <span className="muted" title="Its project was deleted, so sync won't add it again. Import it to bring it back.">
                          Dismissed
                        </span>
                      ) : (
                        <Readiness repo={r} rule={autoPublish} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function GithubPage() {
  const toast = useToast();
  const { data, setData, loading, error, reload } = useLoad(loadGithub);
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    try {
      const { result } = await invokeFunction(supabase, "github-sync", { action: "sync" });
      toast.success(`Sync finished: ${plural(result.fetched, "repository", "repositories")}, ${result.new} new.`);
    } catch (err) {
      toast.error(describeError(err, "Sync failed."));
    } finally {
      setSyncing(false);
      reload();
    }
  };

  return (
    <>
      <PageHeader
        title="GitHub"
        description="Push a repo to GitHub and it shows on your portfolio once its README is complete. The table shows what each one still needs."
      />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton lines={6} />}

      {data && (
        <div className="form-stack">
          <div className="grid-2">
            <ConfigCard config={data.config} onSaved={(config) => setData((d) => ({ ...d, config }))} />
            <StatusCard config={data.config} syncing={syncing} onSync={sync} />
          </div>

          {data.repos.length === 0 ? <SetupGuide /> : <RepoTable repos={data.repos} projects={data.projects} autoPublish={data.config.auto_publish} onImported={reload} />}
        </div>
      )}
    </>
  );
}
