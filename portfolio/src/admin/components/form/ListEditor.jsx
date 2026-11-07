import Icon from "../Icon";
import IconButton from "../ui/IconButton";

/**
 * Editable list of small objects, e.g. stats or social links.
 * `fields` is [{ key, label, type?, placeholder?, width? }].
 */
export default function ListEditor({ label, hint, items = [], onChange, fields, empty, addLabel = "Add", errors = {}, errorKey, max = 12 }) {
  const update = (index, key, val) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: val } : item)));
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const blank = Object.fromEntries(fields.map((f) => [f.key, ""]));

  return (
    <fieldset className="list-editor">
      <legend className="field__label">{label}</legend>
      {hint && <p className="field__hint">{hint}</p>}
      {items.length === 0 && <p className="list-editor__empty">{empty || "Nothing added yet."}</p>}
      {items.map((item, i) => (
        <div key={i} className="list-editor__row">
          {fields.map((f) => {
            const err = errors[`${errorKey}.${i}.${f.key}`];
            return (
              <label key={f.key} className="list-editor__cell" style={{ flex: f.width || 1 }}>
                <span className="sr-only">
                  {f.label} {i + 1}
                </span>
                <input
                  className={`input ${err ? "is-invalid" : ""}`}
                  type={f.type || "text"}
                  value={item[f.key] ?? ""}
                  placeholder={f.placeholder || f.label}
                  aria-invalid={err ? true : undefined}
                  title={err}
                  onChange={(e) =>
                    update(i, f.key, f.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)
                  }
                />
                {err && <span className="field__error">{err}</span>}
              </label>
            );
          })}
          <div className="list-editor__tools">
            <IconButton icon="up" label="Move up" onClick={() => move(i, -1)} disabled={i === 0} />
            <IconButton icon="down" label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1} />
            <IconButton icon="trash" label="Remove" tone="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} />
          </div>
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onChange([...items, blank])}>
          <Icon name="plus" size={14} /> {addLabel}
        </button>
      )}
    </fieldset>
  );
}
