import { useState } from "react";
import { accentColors } from "../../data/site";
import { SelectField, TextField, Toggle } from "../components/form";
import Icon from "../components/Icon";
import { Badge, EmptyState, ErrorState, IconButton, Modal, PageHeader, Skeleton } from "../components/ui";
import { useConfirm, useToast } from "../context/hooks";
import useLoad from "../hooks/useLoad";
import { api, moveInList, nextSortOrder } from "../lib/api";
import { describeError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { validateSkill, validateSkillCategory } from "../lib/validation";
import SkillSuggestions from "../components/skills/SkillSuggestions";

const ACCENTS = Object.keys(accentColors).map((key) => ({ value: key, label: key[0].toUpperCase() + key.slice(1) }));

const REPO_COLUMNS = "id, name, readme_title, state, language, languages, topics, readme_tech, readme_topics";

async function loadSkills() {
  const [categories, skills, repos, dismissed] = await Promise.all([
    api.list("skill_categories"),
    api.list("skills"),
    supabase.from("github_repos").select(REPO_COLUMNS),
    supabase.from("skill_suggestion_dismissals").select("key, name").order("created_at"),
  ]);
  return { categories, skills, repos: repos.data || [], dismissed: dismissed.data || [] };
}

function CategoryForm({ initial, onCancel, onSubmit }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = validateSkillCategory(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const ok = await onSubmit({
      title: values.title.trim(),
      blurb: values.blurb.trim(),
      accent: values.accent,
      published: values.published,
    });
    if (!ok) setSaving(false);
  };

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <TextField label="Category name" value={values.title} onChange={set("title")} error={errors.title} max={80} autoFocus />
      <TextField label="Short description" multiline rows={2} value={values.blurb} onChange={set("blurb")} error={errors.blurb} max={300} />
      <SelectField label="Accent colour" value={values.accent} onChange={set("accent")} options={ACCENTS} />
      <Toggle label="Visible on portfolio" checked={values.published} onChange={set("published")} />
      <div className="modal__actions">
        <button type="button" className="a-btn a-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="a-btn a-btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save category"}
        </button>
      </div>
    </form>
  );
}

function SkillForm({ initial, categories, onCancel, onSubmit }) {
  const [values, setValues] = useState({ ...initial, level: initial.level ?? "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = validateSkill(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const ok = await onSubmit({
      name: values.name.trim(),
      category_id: values.category_id,
      level: values.level === "" ? null : Number(values.level),
      published: values.published,
    });
    if (!ok) setSaving(false);
  };

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <TextField label="Skill or technology" value={values.name} onChange={set("name")} error={errors.name} max={60} autoFocus />
      <SelectField
        label="Category"
        value={values.category_id}
        onChange={set("category_id")}
        options={categories.map((c) => ({ value: c.id, label: c.title }))}
      />
      <TextField
        label="Proficiency (optional)"
        type="number"
        min={0}
        max={100}
        hint="0–100. Leave empty to list the skill without a percentage bar."
        value={values.level}
        onChange={set("level")}
        error={errors.level}
      />
      <Toggle label="Visible on portfolio" checked={values.published} onChange={set("published")} />
      <div className="modal__actions">
        <button type="button" className="a-btn a-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="a-btn a-btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save skill"}
        </button>
      </div>
    </form>
  );
}

export default function SkillsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, setData, loading, error, reload } = useLoad(loadSkills);
  // { kind: "category" | "skill", item: object | null, categoryId? }
  const [editing, setEditing] = useState(null);

  const replace = (key, saved) => setData((d) => ({ ...d, [key]: d[key].map((x) => (x.id === saved.id ? saved : x)) }));

  const saveCategory = async (values) => {
    try {
      if (editing.item) {
        replace("categories", await api.update("skill_categories", editing.item.id, values));
      } else {
        const created = await api.insert("skill_categories", { ...values, sort_order: nextSortOrder(data.categories) });
        setData((d) => ({ ...d, categories: [...d.categories, created] }));
      }
      toast.success("Category saved.");
      setEditing(null);
      return true;
    } catch (err) {
      toast.error(describeError(err));
      return false;
    }
  };

  const saveSkill = async (values) => {
    try {
      if (editing.item) {
        replace("skills", await api.update("skills", editing.item.id, values));
      } else {
        const siblings = data.skills.filter((s) => s.category_id === values.category_id);
        const created = await api.insert("skills", { ...values, sort_order: nextSortOrder(siblings) });
        setData((d) => ({ ...d, skills: [...d.skills, created] }));
      }
      toast.success("Skill saved.");
      setEditing(null);
      return true;
    } catch (err) {
      toast.error(describeError(err));
      return false;
    }
  };

  const toggle = async (table, key, item) => {
    try {
      replace(key, await api.update(table, item.id, { published: !item.published }));
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const reorder = async (table, key, list, index, delta, scope) => {
    const next = moveInList(list, index, delta);
    try {
      const saved = await api.reorder(table, next);
      setData((d) => ({
        ...d,
        [key]: scope ? [...d[key].filter((x) => !scope(x)), ...saved] : saved,
      }));
    } catch (err) {
      toast.error(describeError(err, "Could not save the new order."));
      reload();
    }
  };

  const removeCategory = async (category, count) => {
    const ok = await confirm({
      title: `Delete "${category.title}"?`,
      message: count ? `Its ${count} skills are deleted too. This can't be undone.` : "This can't be undone.",
      confirmLabel: "Delete category",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.remove("skill_categories", category.id);
      setData((d) => ({
        ...d,
        categories: d.categories.filter((c) => c.id !== category.id),
        skills: d.skills.filter((s) => s.category_id !== category.id),
      }));
      toast.success("Category deleted.");
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const removeSkill = async (skill) => {
    const ok = await confirm({ title: `Delete "${skill.name}"?`, confirmLabel: "Delete skill", danger: true });
    if (!ok) return;
    try {
      await api.remove("skills", skill.id);
      setData((d) => ({ ...d, skills: d.skills.filter((s) => s.id !== skill.id) }));
      toast.success("Skill deleted.");
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const addCategory = () => setEditing({ kind: "category", item: null });

  return (
    <>
      <PageHeader
        title="Skills"
        description="Grouped technology lists. Levels are optional and shown only when you set them."
        actions={
          <button type="button" className="a-btn a-btn--primary" onClick={addCategory}>
            <Icon name="plus" size={16} /> Add category
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton lines={6} />}

      {data && data.categories.length === 0 && data.repos.length === 0 && (
        <EmptyState
          icon="sparkles"
          title="No skill categories"
          text="Create a category such as 'Frontend Development', then add skills to it."
          action={
            <button type="button" className="a-btn a-btn--primary" onClick={addCategory}>
              <Icon name="plus" size={16} /> Add category
            </button>
          }
        />
      )}

      {data && (
        <div className="form-stack">
          <SkillSuggestions data={data} setData={setData} />
          {data.categories.map((category, ci) => {
            const skills = data.skills.filter((s) => s.category_id === category.id);
            return (
              <section key={category.id} className={`card ${category.published ? "" : "is-hidden"}`}>
                <div className="card__head">
                  <div className="category-head">
                    <span className="dot" style={{ background: accentColors[category.accent] }} aria-hidden="true" />
                    <div>
                      <h2 className="card__title">
                        {category.title} {!category.published && <Badge>hidden</Badge>}
                      </h2>
                      {category.blurb && <p className="card__desc">{category.blurb}</p>}
                    </div>
                  </div>
                  <div className="row-actions">
                    <IconButton
                      icon="up"
                      label="Move category up"
                      disabled={ci === 0}
                      onClick={() => reorder("skill_categories", "categories", data.categories, ci, -1)}
                    />
                    <IconButton
                      icon="down"
                      label="Move category down"
                      disabled={ci === data.categories.length - 1}
                      onClick={() => reorder("skill_categories", "categories", data.categories, ci, 1)}
                    />
                    <IconButton
                      icon={category.published ? "eyeOff" : "eye"}
                      label={category.published ? "Hide category" : "Show category"}
                      onClick={() => toggle("skill_categories", "categories", category)}
                    />
                    <IconButton icon="edit" label="Edit category" onClick={() => setEditing({ kind: "category", item: category })} />
                    <IconButton icon="trash" label="Delete category" tone="danger" onClick={() => removeCategory(category, skills.length)} />
                  </div>
                </div>

                {skills.length === 0 ? (
                  <p className="muted">No skills in this category yet.</p>
                ) : (
                  <ul className="skill-rows">
                    {skills.map((skill, si) => (
                      <li key={skill.id} className={skill.published ? "" : "is-hidden"}>
                        <span className="skill-rows__name">{skill.name}</span>
                        {skill.level != null ? (
                          <span className="meter" aria-label={`${skill.level}%`}>
                            <span style={{ width: `${skill.level}%` }} />
                          </span>
                        ) : (
                          <span className="muted small">no level</span>
                        )}
                        <span className="skill-rows__level">{skill.level != null ? `${skill.level}%` : ""}</span>
                        <div className="row-actions">
                          <IconButton
                            icon="up"
                            label="Move up"
                            disabled={si === 0}
                            onClick={() =>
                              reorder("skills", "skills", skills, si, -1, (s) => s.category_id === category.id)
                            }
                          />
                          <IconButton
                            icon="down"
                            label="Move down"
                            disabled={si === skills.length - 1}
                            onClick={() =>
                              reorder("skills", "skills", skills, si, 1, (s) => s.category_id === category.id)
                            }
                          />
                          <IconButton
                            icon={skill.published ? "eyeOff" : "eye"}
                            label={skill.published ? "Hide" : "Show"}
                            onClick={() => toggle("skills", "skills", skill)}
                          />
                          <IconButton icon="edit" label="Edit" onClick={() => setEditing({ kind: "skill", item: skill })} />
                          <IconButton icon="trash" label="Delete" tone="danger" onClick={() => removeSkill(skill)} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  className="a-btn a-btn--ghost a-btn--sm"
                  onClick={() => setEditing({ kind: "skill", item: null, categoryId: category.id })}
                >
                  <Icon name="plus" size={14} /> Add skill
                </button>
              </section>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        title={`${editing?.item ? "Edit" : "Add"} ${editing?.kind === "category" ? "category" : "skill"}`}
        onClose={() => setEditing(null)}
        size="sm"
      >
        {editing?.kind === "category" && (
          <CategoryForm
            key={editing.item?.id ?? "new"}
            initial={editing.item ?? { title: "", blurb: "", accent: "violet", published: true }}
            onCancel={() => setEditing(null)}
            onSubmit={saveCategory}
          />
        )}
        {editing?.kind === "skill" && (
          <SkillForm
            key={editing.item?.id ?? "new"}
            initial={editing.item ?? { name: "", category_id: editing.categoryId, level: null, published: true }}
            categories={data.categories}
            onCancel={() => setEditing(null)}
            onSubmit={saveSkill}
          />
        )}
      </Modal>
    </>
  );
}
