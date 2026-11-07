import { useId, useState } from "react";
import Icon from "../Icon";
import Field from "./Field";
import { describedBy } from "./describedBy";

/** Chip input for short string lists: Enter or comma adds, Backspace removes. */
export default function TagInput({ label, hint, error, value = [], onChange, placeholder = "Type and press Enter", max = 30 }) {
  const id = useId();
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.includes(s));
    if (items.length) onChange([...value, ...items].slice(0, max));
    setDraft("");
  };

  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className="tag-input">
        {value.map((tag, i) => (
          <span key={tag} className="tag">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={`Remove ${tag}`}
            >
              <Icon name="x" size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
          aria-describedby={describedBy(id, error, hint)}
        />
      </div>
    </Field>
  );
}
