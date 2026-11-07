import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ParagraphsEditor, TextField, Toggle } from "../components/form";
import Icon from "../components/Icon";
import MediaUpload from "../components/MediaUpload";
import { Badge, EmptyState, ErrorState, IconButton, Modal, PageHeader, Skeleton } from "../components/ui";
import { useConfirm, useToast } from "../context/hooks";
import useLoad from "../hooks/useLoad";
import { api } from "../lib/api";
import { describeError } from "../lib/errors";
import { formatPeriod, plural } from "../lib/format";
import { validateExperience } from "../lib/validation";

const KINDS = {
  work: {
    label: "Work",
    plural: "Work experience",
    icon: "briefcase",
    title: "Role",
    titleHint: "e.g. Front-End Developer",
    org: "Company",
    url: "Company website",
  },
  education: {
    label: "Education",
    plural: "Education",
    icon: "graduation",
    title: "Degree or programme",
    titleHint: "e.g. BS Computer Science",
    org: "School or university",
    url: "Website",
  },
  certification: {
    label: "Certification",
    plural: "Certifications",
    icon: "award",
    title: "Certificate",
    titleHint: "e.g. Meta Front-End Developer",
    org: "Issued by",
    url: "Credential URL",
  },
};

const BLANK = {
  kind: "work",
  title: "",
  organization: "",
  location: "",
  employment_type: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  highlights: [],
  url: "",
  logo_url: null,
  credential_id: "",
  published: true,
};

const toMonth = (date) => (date ? String(date).slice(0, 7) : "");
const fromMonth = (month) => (month ? `${month}-01` : null);

const loadExperience = () => api.list("experience");

/** Same order as the public timeline: current first, then newest. */
function byRecency(a, b) {
  if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
  const da = a.end_date || a.start_date || "";
  const db = b.end_date || b.start_date || "";
  return db.localeCompare(da) || a.sort_order - b.sort_order;
}

function ExperienceForm({ initial, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => ({
    ...BLANK,
    ...initial,
    start_date: toMonth(initial.start_date),
    end_date: toMonth(initial.end_date),
    url: initial.url ?? "",
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));
  const kind = KINDS[values.kind];
  const isCert = values.kind === "certification";

  const submit = async (e) => {
    e.preventDefault();
    const found = validateExperience(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const ok = await onSubmit({
      kind: values.kind,
      title: values.title.trim(),
      organization: values.organization.trim(),
      location: values.location.trim(),
      employment_type: values.kind === "work" ? values.employment_type.trim() : "",
      start_date: fromMonth(values.start_date),
      end_date: values.is_current ? null : fromMonth(values.end_date),
      is_current: !isCert && values.is_current,
      description: values.description.trim(),
      highlights: values.highlights.map((h) => h.trim()).filter(Boolean),
      url: values.url.trim() || null,
      logo_url: values.logo_url || null,
      credential_id: isCert ? values.credential_id.trim() : "",
      published: values.published,
    });
    if (!ok) setSaving(false);
  };

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <div className="field">
        <span className="field__label">Type</span>
        <div className="segmented" role="radiogroup" aria-label="Type" style={{ alignSelf: "flex-start" }}>
          {Object.entries(KINDS).map(([key, k]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={values.kind === key}
              className={values.kind === key ? "is-active" : ""}
              onClick={() => set("kind")(key)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-grid">
        <TextField className="span-2" label={kind.title} placeholder={kind.titleHint} value={values.title} onChange={set("title")} error={errors.title} max={120} autoFocus />
        <TextField label={kind.org} value={values.organization} onChange={set("organization")} error={errors.organization} max={120} />
        {values.kind === "work" ? (
          <TextField label="Employment type" placeholder="Full-time, Freelance, Internship…" value={values.employment_type} onChange={set("employment_type")} max={40} list="employment-types" />
        ) : (
          <TextField label="Location" value={values.location} onChange={set("location")} max={80} />
        )}
        <datalist id="employment-types">
          {["Full-time", "Part-time", "Freelance", "Contract", "Internship", "Remote"].map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        {values.kind === "work" && <TextField className="span-2" label="Location" placeholder="Multan, Pakistan · Remote" value={values.location} onChange={set("location")} max={80} />}
        <TextField label={isCert ? "Issued" : "Start"} type="month" value={values.start_date} onChange={set("start_date")} />
        {isCert ? (
          <TextField label="Expires (optional)" type="month" value={values.end_date} onChange={set("end_date")} error={errors.end_date} />
        ) : (
          <TextField label="End" type="month" value={values.end_date} onChange={set("end_date")} error={errors.end_date} disabled={values.is_current} />
        )}
      </div>

      {!isCert && (
        <Toggle
          label={values.kind === "work" ? "I currently work here" : "I'm currently studying here"}
          checked={values.is_current}
          onChange={set("is_current")}
        />
      )}

      <TextField label="Description" multiline rows={3} value={values.description} onChange={set("description")} error={errors.description} max={1200} />
      {!isCert && (
        <ParagraphsEditor
          label="Highlights"
          hint="Achievements or responsibilities, one per line."
          value={values.highlights}
          onChange={set("highlights")}
          max={8}
          rows={1}
          maxLength={240}
          addLabel="Add highlight"
          itemLabel="Highlight"
        />
      )}

      <div className="form-grid">
        <TextField label={kind.url} placeholder="https://" value={values.url} onChange={set("url")} error={errors.url} />
        {isCert && <TextField label="Credential ID" value={values.credential_id} onChange={set("credential_id")} max={120} />}
      </div>

      <MediaUpload label="Logo (optional)" value={values.logo_url} onChange={set("logo_url")} folder="experience" aspect="1 / 1" compact />

      <Toggle label="Visible on portfolio" checked={values.published} onChange={set("published")} />

      <div className="modal__actions">
        <button type="button" className="a-btn a-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="a-btn a-btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save entry"}
        </button>
      </div>
    </form>
  );
}

export default function ExperiencePage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const { data, setData, loading, error, reload } = useLoad(loadExperience);
  const [tab, setTab] = useState("all");
  const [editing, setEditing] = useState(() => (params.get("new") === "1" ? { ...BLANK } : null));

  const closeEditor = () => {
    setEditing(null);
    if (params.has("new")) setParams({}, { replace: true });
  };

  const counts = useMemo(() => {
    const c = { all: data?.length || 0 };
    for (const e of data || []) c[e.kind] = (c[e.kind] || 0) + 1;
    return c;
  }, [data]);

  const visible = useMemo(
    () => (data || []).filter((e) => tab === "all" || e.kind === tab).sort(byRecency),
    [data, tab]
  );

  const save = async (values) => {
    try {
      if (editing.id) {
        const saved = await api.update("experience", editing.id, values);
        setData((list) => list.map((e) => (e.id === saved.id ? saved : e)));
      } else {
        const created = await api.insert("experience", values);
        setData((list) => [...list, created]);
      }
      toast.success("Entry saved.");
      closeEditor();
      return true;
    } catch (err) {
      toast.error(describeError(err));
      return false;
    }
  };

  const togglePublished = async (entry) => {
    try {
      const saved = await api.update("experience", entry.id, { published: !entry.published });
      setData((list) => list.map((e) => (e.id === saved.id ? saved : e)));
      toast.success(saved.published ? "Entry is visible." : "Entry hidden.");
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const remove = async (entry) => {
    const ok = await confirm({
      title: `Delete "${entry.title}"?`,
      message: "This removes it from your timeline permanently. Hide it instead if you might need it again.",
      confirmLabel: "Delete entry",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.remove("experience", entry.id);
      setData((list) => list.filter((e) => e.id !== entry.id));
      toast.success("Entry deleted.");
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const addNew = (kind = tab === "all" ? "work" : tab) => setEditing({ ...BLANK, kind });

  return (
    <>
      <PageHeader
        title="Experience"
        description="Work history, education and certifications. Shown as a timeline on your portfolio, newest first."
        actions={
          <button type="button" className="a-btn a-btn--primary" onClick={() => addNew()}>
            <Icon name="plus" size={16} /> Add entry
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton lines={4} height={56} />}

      {data && data.length === 0 && (
        <div className="card">
          <EmptyState
            icon="briefcase"
            title="Build your timeline"
            text="Add your jobs, degree and certificates. The Experience section appears on the site as soon as there is one visible entry."
            action={
              <div className="inline-actions" style={{ justifyContent: "center" }}>
                {Object.entries(KINDS).map(([key, k]) => (
                  <button key={key} type="button" className="a-btn a-btn--ghost" onClick={() => addNew(key)}>
                    <Icon name={k.icon} size={16} /> {k.label}
                  </button>
                ))}
              </div>
            }
          />
        </div>
      )}

      {data && data.length > 0 && (
        <div className="form-stack">
          <div className="segmented" role="group" aria-label="Filter entries" style={{ alignSelf: "flex-start" }}>
            {[["all", "All"], ...Object.entries(KINDS).map(([key, k]) => [key, k.plural])].map(([key, label]) => (
              <button key={key} type="button" aria-pressed={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                {label} · {counts[key] || 0}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={KINDS[tab]?.icon || "briefcase"}
                title={`No ${KINDS[tab]?.plural.toLowerCase() || "entries"} yet`}
                action={
                  <button type="button" className="a-btn a-btn--primary" onClick={() => addNew()}>
                    <Icon name="plus" size={16} /> Add {KINDS[tab]?.label.toLowerCase()}
                  </button>
                }
              />
            </div>
          ) : (
            <ul className="item-list">
              {visible.map((entry, i) => (
                <li key={entry.id} className={`item ${entry.published ? "" : "is-hidden"}`} style={{ "--i": i }}>
                  <span className="item__icon" aria-hidden="true">
                    {entry.logo_url ? <img src={entry.logo_url} alt="" /> : <Icon name={KINDS[entry.kind].icon} size={20} />}
                  </span>
                  <div className="item__body">
                    <p className="item__title">
                      {entry.title}
                      {entry.is_current && <Badge tone="success">Current</Badge>}
                      {!entry.published && <Badge>hidden</Badge>}
                    </p>
                    <p className="item__meta">
                      {[entry.organization, entry.employment_type, entry.location].filter(Boolean).join(" · ") || KINDS[entry.kind].label}
                    </p>
                    <p className="timeline-date">{formatPeriod(entry) || "No dates"}</p>
                    {entry.description && <p className="item__text">{entry.description}</p>}
                    {entry.highlights.length > 0 && <p className="muted small">{plural(entry.highlights.length, "highlight")}</p>}
                  </div>
                  <div className="row-actions">
                    <IconButton icon={entry.published ? "eyeOff" : "eye"} label={entry.published ? "Hide" : "Show"} onClick={() => togglePublished(entry)} />
                    <IconButton icon="edit" label="Edit" onClick={() => setEditing(entry)} />
                    <IconButton icon="trash" label="Delete" tone="danger" onClick={() => remove(entry)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal open={Boolean(editing)} title={editing?.id ? "Edit entry" : "Add entry"} onClose={closeEditor}>
        {editing && <ExperienceForm key={editing.id ?? `new-${editing.kind}`} initial={editing} onCancel={closeEditor} onSubmit={save} />}
      </Modal>
    </>
  );
}
