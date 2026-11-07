import { useId } from "react";
import Field from "./Field";
import { describedBy } from "./describedBy";

export default function SelectField({ label, hint, error, value, onChange, options, className }) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error} className={className}>
      <select
        id={id}
        className="input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy(id, error, hint)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
