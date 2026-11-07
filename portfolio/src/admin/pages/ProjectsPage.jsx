import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { coverGradients } from "../../data/site";
import Icon from "../components/Icon";
import { Badge, EmptyState, ErrorState, IconButton, PageHeader, Skeleton } from "../components/ui";
import { useConfirm, useToast } from "../context/hooks";
import useLoad from "../hooks/useLoad";
import { api, moveInList } from "../lib/api";
import { describeError } from "../lib/errors";
import { plural, timeAgo } from "../lib/format";
import { captureScreenshot } from "../lib/media";

const PAGE_SIZE = 12;
const loadProjects = () => api.list("projects");

function Thumb({ project }) {
  return (
    <span
      className="thumb"
      style={{ background: project.thumbnail_url ? undefined : coverGradients[project.cover] }}
      aria-hidden="true"
    >
      {project.thumbnail_url ? <img src={project.thumbnail_url} alt="" loading="lazy" /> : project.title.slice(0, 1)}
    </span>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: projects, setData, loading, error, reload } = useLoad(loadProjects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [capturing, setCapturing] = useState(null); // { done, total } while covers are captured

  // Projects with a live demo but no cover image: a screenshot can fill the gap.
  const needCovers = useMemo(
    () => (projects || []).filter((p) => !p.thumbnail_url && /^https?:\/\//i.test(p.demo_url || "")),
    [projects]
  );

  const captureCovers = async () => {
    const list = needCovers;
    let done = 0;
    let failed = 0;
    setCapturing({ done, total: list.length });
    for (const project of list) {
      try {
        const url = await captureScreenshot(project.demo_url, `projects/${project.id}`);
        const saved = await api.update("projects", project.id, { thumbnail_url: url });
        setData((all) => all.map((p) => (p.id === saved.id ? saved : p)));
      } catch (err) {
        failed += 1;
        toast.error(`${project.title}: ${describeError(err)}`);
      }
      done += 1;
      setCapturing({ done, total: list.length });
    }
    setCapturing(null);
    if (done - failed) toast.success(`${plural(done - failed, "cover")} captured from live demos.`);
  };

  const categories = useMemo(() => [...new Set((projects || []).map((p) => p.category))].sort(), [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects || []).filter(
      (p) =>
        (status === "all" || p.status === status || (status === "featured" && p.featured)) &&
        (category === "all" || p.category === category) &&
        (!q || `${p.title} ${p.summary} ${p.tech.join(" ")}`.toLowerCase().includes(q))
    );
  }, [projects, query, status, category]);

  const isFiltered = query || status !== "all" || category !== "all";
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const patch = async (project, values, message) => {
    try {
      const saved = await api.update("projects", project.id, values);
      setData((list) => list.map((p) => (p.id === saved.id ? saved : p)));
      toast.success(message);
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const move = async (project, delta) => {
    const index = projects.findIndex((p) => p.id === project.id);
    const next = moveInList(projects, index, delta);
    setData(next);
    try {
      setData(await api.reorder("projects", next));
    } catch (err) {
      toast.error(describeError(err, "Could not save the new order."));
      reload();
    }
  };

  const remove = async (project) => {
    const ok = await confirm({
      title: `Delete "${project.title}"?`,
      message:
        project.source === "github"
          ? "The project is removed from your portfolio. The GitHub repository is not affected and can be imported again."
          : "This permanently removes the project and can't be undone.",
      confirmLabel: "Delete project",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.remove("projects", project.id);
      setData((list) => list.filter((p) => p.id !== project.id));
      toast.success("Project deleted.");
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const setFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Drafts are only visible here. Publish a project to show it on your portfolio."
        actions={
          <>
            <Link to="/admin/github" className="a-btn a-btn--ghost">
              <Icon name="github" size={16} /> Import from GitHub
            </Link>
            <Link to="/admin/projects/new" className="a-btn a-btn--primary">
              <Icon name="plus" size={16} /> New project
            </Link>
          </>
        }
      />

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !projects && <Skeleton lines={5} height={44} />}

      {projects && projects.length === 0 && (
        <EmptyState
          icon="folder"
          title="No projects yet"
          text="Add one by hand, or import repositories from GitHub as drafts."
          action={
            <Link to="/admin/projects/new" className="a-btn a-btn--primary">
              <Icon name="plus" size={16} /> Create your first project
            </Link>
          }
        />
      )}

      {projects && needCovers.length > 0 && (
        <div className="notice notice--info" style={{ marginBottom: 16, alignItems: "center" }}>
          <Icon name="camera" size={16} />
          <span style={{ flex: 1 }}>
            {plural(needCovers.length, "project")} {needCovers.length === 1 ? "has" : "have"} a live demo but no cover image.
            Capture screenshots of the live sites to use as covers.
          </span>
          <button type="button" className="a-btn a-btn--primary a-btn--sm" onClick={captureCovers} disabled={Boolean(capturing)}>
            {capturing ? `Capturing ${capturing.done + 1} of ${capturing.total}…` : "Capture covers"}
          </button>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="card card--flush">
          <div className="toolbar">
            <label className="search">
              <Icon name="search" size={16} />
              <span className="sr-only">Search projects</span>
              <input
                type="search"
                placeholder="Search title, description or tech"
                value={query}
                onChange={setFilter(setQuery)}
              />
            </label>
            <label>
              <span className="sr-only">Status</span>
              <select className="input input--sm" value={status} onChange={setFilter(setStatus)}>
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="featured">Featured</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Category</span>
              <select className="input input--sm" value={category} onChange={setFilter(setCategory)}>
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <span className="toolbar__count">
              {filtered.length} of {projects.length}
            </span>
          </div>

          {rows.length === 0 ? (
            <EmptyState icon="search" title="No matching projects" text="Try a different search or filter." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col">Status</th>
                    <th scope="col">Category</th>
                    <th scope="col">Updated</th>
                    <th scope="col" className="table__actions-col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const index = projects.findIndex((x) => x.id === p.id);
                    return (
                      <tr key={p.id}>
                        <td>
                          <Link to={`/admin/projects/${p.id}`} className="table__title">
                            <Thumb project={p} />
                            <span>
                              <strong>{p.title}</strong>
                              <small>
                                {p.source === "github" && (
                                  <>
                                    <Icon name="github" size={12} /> GitHub ·{" "}
                                  </>
                                )}
                                /{p.slug}
                              </small>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <span className="badges">
                            <Badge tone={p.status === "published" ? "success" : "neutral"}>{p.status}</Badge>
                            {p.featured && <Badge tone="violet">featured</Badge>}
                            {!p.show_on_home && <Badge tone="neutral">hidden from home</Badge>}
                          </span>
                        </td>
                        <td>{p.category}</td>
                        <td className="muted">{timeAgo(p.updated_at)}</td>
                        <td>
                          <div className="row-actions">
                            {!isFiltered && (
                              <>
                                <IconButton icon="up" label="Move up" onClick={() => move(p, -1)} disabled={index === 0} />
                                <IconButton
                                  icon="down"
                                  label="Move down"
                                  onClick={() => move(p, 1)}
                                  disabled={index === projects.length - 1}
                                />
                              </>
                            )}
                            <IconButton
                              icon="star"
                              label={p.featured ? "Unfeature" : "Feature"}
                              active={p.featured}
                              onClick={() =>
                                patch(p, { featured: !p.featured }, p.featured ? "Removed from featured." : "Marked as featured.")
                              }
                            />
                            <IconButton
                              icon={p.status === "published" ? "eyeOff" : "eye"}
                              label={p.status === "published" ? "Unpublish" : "Publish"}
                              onClick={() =>
                                patch(
                                  p,
                                  { status: p.status === "published" ? "draft" : "published" },
                                  p.status === "published" ? "Moved back to drafts." : "Published to your portfolio."
                                )
                              }
                            />
                            <IconButton icon="edit" label="Edit" onClick={() => navigate(`/admin/projects/${p.id}`)} />
                            <IconButton icon="trash" label="Delete" tone="danger" onClick={() => remove(p)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" className="a-btn a-btn--ghost a-btn--sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
                Previous
              </button>
              <span>
                Page {current} of {pages}
              </span>
              <button type="button" className="a-btn a-btn--ghost a-btn--sm" disabled={current === pages} onClick={() => setPage(current + 1)}>
                Next
              </button>
            </nav>
          )}
          {isFiltered && <p className="toolbar__note">Clear filters to reorder projects.</p>}
        </div>
      )}
    </>
  );
}
