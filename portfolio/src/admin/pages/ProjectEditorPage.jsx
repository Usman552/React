import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DEFAULT_CATEGORY, PROJECT_CATEGORIES } from "../../../supabase/functions/_shared/categories.js";
import { coverGradients } from "../../data/site";
import { ParagraphsEditor, SelectField, TagInput, TextField, Toggle } from "../components/form";
import Icon from "../components/Icon";
import MediaUpload from "../components/MediaUpload";
import GalleryEditor from "../components/project/GalleryEditor";
import GithubSourcePanel from "../components/project/GithubSourcePanel";
import { Card, ErrorState, PageHeader, SaveBar, Skeleton } from "../components/ui";
import { useConfirm, useToast } from "../context/hooks";
import useForm from "../hooks/useForm";
import useLoad from "../hooks/useLoad";
import { api } from "../lib/api";
import { describeError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { slugify, validateProject } from "../lib/validation";

const EDITABLE = [
  "title", "slug", "summary", "details", "features", "category", "tech", "tags", "thumbnail_url", "gallery",
  "cover", "demo_url", "repo_url", "status", "featured", "show_on_home", "completed_at", "github_auto_update",
];

const BLANK = {
  title: "",
  slug: "",
  summary: "",
  details: "",
  features: [],
  category: DEFAULT_CATEGORY,
  tech: [],
  tags: [],
  thumbnail_url: null,
  gallery: [],
  cover: "violet-cyan",
  demo_url: "",
  repo_url: "",
  status: "draft",
  featured: false,
  show_on_home: true,
  completed_at: "",
  github_auto_update: false,
};

const pick = (row) => Object.fromEntries(EDITABLE.map((k) => [k, row[k] ?? BLANK[k]]));

function toPayload(v) {
  return {
    ...v,
    title: v.title.trim(),
    summary: v.summary.trim(),
    category: v.category.trim(),
    demo_url: v.demo_url?.trim() || null,
    repo_url: v.repo_url?.trim() || null,
    completed_at: v.completed_at || null,
    features: v.features.map((f) => f.trim()).filter(Boolean),
    gallery: v.gallery.filter((g) => g.url),
  };
}

async function loadEditor(id) {
  const projects = await api.list("projects");
  const project = id ? projects.find((p) => p.id === id) : null;
  if (id && !project) throw new Error("This project doesn't exist or was deleted.");

  let repo = null;
  if (project?.github_repo_id) {
    const { data } = await supabase.from("github_repos").select("*").eq("id", project.github_repo_id).maybeSingle();
    repo = data;
  }
  return {
    project,
    repo,
    categories: [...new Set([...PROJECT_CATEGORIES, ...projects.map((p) => p.category)])],
    nextOrder: projects.reduce((max, p) => Math.max(max, p.sort_order), 0) + 10,
  };
}

function ProjectForm({ data }) {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const isNew = !data.project;
  const form = useForm(isNew ? BLANK : pick(data.project));
  const { values: v, bind, errors } = form;
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const folder = `projects/${data.project?.id ?? "new"}`;

  const setTitle = (title) => {
    form.set("title", title);
    if (!slugTouched) form.set("slug", slugify(title));
  };

  const applyGithubValues = (values) => {
    Object.entries(values).forEach(([key, value]) => form.set(key, value));
    if ("title" in values && !slugTouched) form.set("slug", slugify(values.title));
    toast.info("Copied from GitHub. Save to keep it.");
  };

  const save = async (overrides = {}) => {
    const next = { ...v, ...overrides };
    const found = validateProject(next);
    form.setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(next);
      if (isNew) {
        const created = await api.insert("projects", { ...payload, sort_order: data.nextOrder, source: "manual" });
        form.commit(pick(created));
        toast.success(payload.status === "published" ? "Project published." : "Draft saved.");
        navigate(`/admin/projects/${created.id}`, { replace: true });
      } else {
        const saved = await api.update("projects", data.project.id, payload);
        form.commit(pick(saved));
        toast.success(saved.status === "published" ? "Saved. Changes are live." : "Draft saved.");
      }
    } catch (err) {
      if (err.code === "23505") form.setErrors({ slug: "Another project already uses this slug." });
      toast.error(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Delete "${v.title}"?`,
      message: "This permanently removes the project from your portfolio.",
      confirmLabel: "Delete project",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.remove("projects", data.project.id);
      toast.success("Project deleted.");
      navigate("/admin/projects");
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const published = v.status === "published";

  return (
    <form
      className="editor"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <PageHeader
        title={isNew ? "New project" : v.title || "Untitled project"}
        description={
          <Link to="/admin/projects" className="back-link">
            ← All projects
          </Link>
        }
        actions={
          <>
            {!isNew && (
              <button type="button" className="a-btn a-btn--ghost a-btn--danger-text" onClick={remove}>
                <Icon name="trash" size={16} /> Delete
              </button>
            )}
            <button
              type="button"
              className="a-btn a-btn--ghost"
              disabled={saving}
              onClick={() => save({ status: published ? "draft" : "published" })}
            >
              {published ? "Unpublish" : "Save & publish"}
            </button>
          </>
        }
      />

      <div className="editor__grid">
        <div className="form-stack">
          <Card title="Basics">
            <div className="form-grid">
              <TextField className="span-2" label="Title" value={v.title} onChange={setTitle} error={errors.title} max={120} autoFocus={isNew} />
              <TextField
                label="Slug"
                hint="Used as a stable identifier."
                value={v.slug}
                onChange={(val) => {
                  setSlugTouched(true);
                  form.set("slug", slugify(val));
                }}
                error={errors.slug}
              />
              <div className="field">
                <TextField label="Category" hint="Visitors browse by category, e.g. 3D Websites." value={v.category} onChange={bind("category")} error={errors.category} max={40} list="project-categories" />
                <datalist id="project-categories">
                  {data.categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <TextField className="span-2" label="Card summary" hint="Two short sentences. Cards show up to three lines." multiline rows={3} value={v.summary} onChange={bind("summary")} error={errors.summary} max={400} />
              <TextField
                className="span-2"
                label="Details"
                hint="Optional. Shown on the project's page. Leave a blank line between paragraphs."
                multiline
                rows={6}
                value={v.details}
                onChange={bind("details")}
                error={errors.details}
                max={5000}
              />
            </div>
          </Card>

          <Card title="Features" description="Key features, listed on the project's page.">
            <ParagraphsEditor
              label="Feature list"
              value={v.features}
              onChange={bind("features")}
              max={12}
              rows={2}
              maxLength={200}
              addLabel="Add feature"
              itemLabel="Feature"
            />
          </Card>

          <Card title="Technology">
            <div className="form-grid">
              <TagInput label="Tech stack" hint="Cards show the first four." value={v.tech} onChange={bind("tech")} max={12} />
              <TagInput label="Tags" hint="Internal labels, e.g. client, open-source." value={v.tags} onChange={bind("tags")} max={12} />
            </div>
          </Card>

          <Card title="Links">
            <div className="form-grid">
              <TextField label="Live demo URL" placeholder="https://my-app.web.app" value={v.demo_url} onChange={bind("demo_url")} error={errors.demo_url} hint="Leave empty to show 'Demo soon'." />
              <TextField label="Repository URL" placeholder="https://github.com/you/repo" value={v.repo_url} onChange={bind("repo_url")} error={errors.repo_url} hint="Kept private unless 'Show Code buttons' is on in Settings." />
              <TextField label="Completed" type="date" value={v.completed_at ?? ""} onChange={bind("completed_at")} />
            </div>
          </Card>

          <Card title="Gallery" description="Optional screenshots for the details dialog.">
            <GalleryEditor items={v.gallery} onChange={bind("gallery")} folder={folder} captureUrl={/^https?:\/\//i.test(v.demo_url || "") ? v.demo_url.trim() : ""} />
          </Card>
        </div>

        <div className="form-stack">
          <Card title="Visibility">
            <SelectField
              label="Status"
              value={v.status}
              onChange={bind("status")}
              options={[
                { value: "draft", label: "Draft (hidden)" },
                { value: "published", label: "Published" },
              ]}
            />
            <Toggle label="Featured" description="Highlighted card with a Featured badge." checked={v.featured} onChange={bind("featured")} />
            <Toggle
              label="Show on homepage"
              description="Off: listed only on the All projects page."
              checked={v.show_on_home}
              onChange={bind("show_on_home")}
            />
          </Card>

          <Card title="Cover">
            <MediaUpload
              label="Thumbnail"
              value={v.thumbnail_url}
              onChange={bind("thumbnail_url")}
              folder={folder}
              aspect="16 / 10"
              captureUrl={/^https?:\/\//i.test(v.demo_url || "") ? v.demo_url.trim() : ""}
              hint="Upload, pick from Media, or capture a screenshot of the live demo."
            />
            <div className="field">
              <span className="field__label">Fallback gradient</span>
              <div className="swatches" role="radiogroup" aria-label="Fallback gradient">
                {Object.entries(coverGradients).map(([key, gradient]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={v.cover === key}
                    aria-label={key.replace("-", " and ")}
                    className={`swatch ${v.cover === key ? "is-active" : ""}`}
                    style={{ background: gradient }}
                    onClick={() => form.set("cover", key)}
                  />
                ))}
              </div>
            </div>
          </Card>

          {data.project?.github_repo_id && (
            <>
              <Card title="Sync with GitHub">
                <Toggle
                  label="Keep in sync with the README"
                  description={
                    v.github_auto_update
                      ? "On: when you push README changes, the title, summary, features, screenshots, tech and links update by themselves. Edits you make to those fields here will be replaced."
                      : "Off: your edits stay exactly as they are. Use the GitHub values below whenever you want."
                  }
                  checked={v.github_auto_update}
                  onChange={bind("github_auto_update")}
                />
              </Card>
              <GithubSourcePanel repo={data.repo} onUse={applyGithubValues} />
            </>
          )}
        </div>
      </div>

      <SaveBar dirty={form.dirty || isNew} saving={saving} onReset={isNew ? null : form.reset} label={isNew ? "Create project" : "Save changes"} />
    </form>
  );
}

function ProjectEditor({ id }) {
  const loader = useCallback(() => loadEditor(id), [id]);
  const { data, loading, error, reload } = useLoad(loader);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <Skeleton lines={8} />;
  return <ProjectForm data={data} />;
}

export default function ProjectEditorPage() {
  const { id } = useParams();
  // Remount per project so form state never leaks between projects.
  return <ProjectEditor key={id ?? "new"} id={id} />;
}
