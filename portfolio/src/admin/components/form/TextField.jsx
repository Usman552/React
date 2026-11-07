import { useId } from "react";
import Field from "./Field";
import { describedBy } from "./describedBy";

export default function TextField({ label, hint, error, value, onChange, max, multiline, rows = 4, className, ...rest }) {
  const id = useId();
  const Tag = multiline ? "textarea" : "input";
  const length = String(value ?? "").length;
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
      count={max ? <span className={`field__count ${length > max ? "is-over" : ""}`}>{length}/{max}</span> : null}
    >
      <Tag
        id={id}
        className="input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        rows={multiline ? rows : undefined}
        {...rest}
      />
    </Field>
  );
}
