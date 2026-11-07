import { useState } from "react";
import { TagInput, TextField, Toggle } from "../components/form";
import Icon from "../components/Icon";
import { Badge, EmptyState, ErrorState, IconButton, Modal, PageHeader, Skeleton } from "../components/ui";
import { useConfirm, useToast } from "../context/hooks";
import useLoad from "../hooks/useLoad";
import { api, moveInList, nextSortOrder } from "../lib/api";
import { describeError } from "../lib/errors";
import { validateService } from "../lib/validation";

const ICONS = ["◆", "◈", "◉", "◇", "▲", "●", "■", "★", "⚡", "✦"];
const BLANK = { title: "", description: "", icon: "◆", tags: [], published: true };
const loadServices = () => api.list("services");

function ServiceForm({ initial, onCancel, onSubmit }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = validateService(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const ok = await onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      icon: values.icon.trim(),
      tags: values.tags,
      published: values.published,
    });
    if (!ok) setSaving(false);
  };

  return (
    <form id="service-form" className="form-stack" onSubmit={submit} noValidate>
      <div className="field">
        <span className="field__label">Icon</span>
        <div className="icon-picker" role="radiogroup" aria-label="Icon">
          {ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              role="radio"
              aria-checked={values.icon === icon}
              className={values.icon === icon ? "is-active" : ""}
              onClick={() => set("icon")(icon)}
            >
              {icon}
            </button>
          ))}
          <input
            className="input input--sm icon-picker__custom"
            aria-label="Custom icon"
            value={values.icon}
            onChange={(e) => set("icon")(e.target.value)}
            maxLength={2}
          />
        </div>
        {errors.icon && <p className="field__error">{errors.icon}</p>}
      </div>
      <TextField label="Title" value={values.title} onChange={set("title")} error={errors.title} max={100} autoFocus />
      <TextField label="Description" multiline rows={4} value={values.description} onChange={set("description")} error={errors.description} max={600} />
      <TagInput label="Technology tags" value={values.tags} onChange={set("tags")} max={8} />
      <Toggle label="Visible on portfolio" checked={values.published} onChange={set("published")} />
      <div className="modal__actions">
        <button type="button" className="a-btn a-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="a-btn a-btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save service"}
        </button>
      </div>
    </form>
  );
}

export default function ServicesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: services, setData, loading, error, reload } = useLoad(loadServices);
  const [editing, setEditing] = useState(null); // null | "new" | service

  const save = async (values) => {
    try {
      if (editing === "new") {
        const created = await api.insert("services", { ...values, sort_order: nextSortOrder(services) });
        setData((list) => [...list, created]);
        toast.success("Service added.");
      } else {
        const saved = await api.update("services", editing.id, values);
        setData((list) => list.map((s) => (s.id === saved.id ? saved : s)));
        toast.success("Service saved.");
      }
      setEditing(null);
      return true;
    } catch (err) {
      toast.error(describeError(err));
      return false;
    }
  };

  const togglePublished = async (service) => {
    try {
      const saved = await api.update("services", service.id, { published: !service.published });
      setData((list) => list.map((s) => (s.id === saved.id ? saved : s)));
      toast.success(saved.published ? "Service is visible." : "Service hidden.");
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const move = async (index, delta) => {
    const next = moveInList(services, index, delta);
    setData(next);
    try {
      setData(await api.reorder("services", next));
    } catch (err) {
      toast.error(describeError(err, "Could not save the new order."));
      reload();
    }
  };

  const remove = async (service) => {
    const ok = await confirm({
      title: `Delete "${service.title}"?`,
      message: "This removes the service card permanently. Hide it instead if you might need it again.",
      confirmLabel: "Delete service",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.remove("services", service.id);
      setData((list) => list.filter((s) => s.id !== service.id));
      toast.success("Service deleted.");
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Services"
        description="The 'What I Do' cards. Order here is the order on the site."
        actions={
          <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing("new")}>
            <Icon name="plus" size={16} /> Add service
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !services && <Skeleton lines={4} height={56} />}

      {services && services.length === 0 && (
        <EmptyState
          icon="layers"
          title="No services yet"
          text="The Services section is hidden on the site until you add one."
          action={
            <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing("new")}>
              <Icon name="plus" size={16} /> Add a service
            </button>
          }
        />
      )}

      {services && services.length > 0 && (
        <ul className="item-list">
          {services.map((s, i) => (
            <li key={s.id} className={`item ${s.published ? "" : "is-hidden"}`}>
              <span className="item__icon" aria-hidden="true">
                {s.icon}
              </span>
              <div className="item__body">
                <p className="item__title">
                  {s.title} {!s.published && <Badge>hidden</Badge>}
                </p>
                <p className="item__text">{s.description}</p>
                {s.tags.length > 0 && (
                  <p className="item__tags">
                    {s.tags.map((t) => (
                      <span key={t} className="tag tag--static">
                        {t}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <div className="row-actions">
                <IconButton icon="up" label="Move up" onClick={() => move(i, -1)} disabled={i === 0} />
                <IconButton icon="down" label="Move down" onClick={() => move(i, 1)} disabled={i === services.length - 1} />
                <IconButton icon={s.published ? "eyeOff" : "eye"} label={s.published ? "Hide" : "Show"} onClick={() => togglePublished(s)} />
                <IconButton icon="edit" label="Edit" onClick={() => setEditing(s)} />
                <IconButton icon="trash" label="Delete" tone="danger" onClick={() => remove(s)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(editing)} title={editing === "new" ? "Add service" : "Edit service"} onClose={() => setEditing(null)}>
        {editing && (
          <ServiceForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? BLANK : editing}
            onCancel={() => setEditing(null)}
            onSubmit={save}
          />
        )}
      </Modal>
    </>
  );
}
