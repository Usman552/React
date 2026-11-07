import Icon from "../Icon";
import IconButton from "../ui/IconButton";

/** Ordered list of text items, e.g. biography paragraphs or project features. */
export default function ParagraphsEditor({
  label,
  hint,
  value = [],
  onChange,
  max = 8,
  rows = 3,
  maxLength = 1500,
  addLabel = "Add paragraph",
  itemLabel = "Paragraph",
}) {
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = value.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset className="list-editor">
      <legend className="field__label">{label}</legend>
      {hint && <p className="field__hint">{hint}</p>}
      {value.map((text, i) => (
        <div key={i} className="list-editor__row list-editor__row--top">
          <label className="list-editor__cell" style={{ flex: 1 }}>
            <span className="sr-only">
              {itemLabel} {i + 1}
            </span>
            <textarea
              className="input"
              rows={rows}
              value={text}
              maxLength={maxLength}
              onChange={(e) => onChange(value.map((p, j) => (j === i ? e.target.value : p)))}
            />
          </label>
          <div className="list-editor__tools">
            <IconButton icon="up" label={`Move ${itemLabel.toLowerCase()} up`} onClick={() => move(i, -1)} disabled={i === 0} />
            <IconButton
              icon="down"
              label={`Move ${itemLabel.toLowerCase()} down`}
              onClick={() => move(i, 1)}
              disabled={i === value.length - 1}
            />
            <IconButton
              icon="trash"
              label={`Remove ${itemLabel.toLowerCase()}`}
              tone="danger"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            />
          </div>
        </div>
      ))}
      {value.length < max && (
        <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onChange([...value, ""])}>
          <Icon name="plus" size={14} /> {addLabel}
        </button>
      )}
    </fieldset>
  );
}
