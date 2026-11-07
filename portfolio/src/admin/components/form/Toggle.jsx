import { useId } from "react";

export default function Toggle({ label, description, checked, onChange, disabled }) {
  const id = useId();
  return (
    <div className="toggle-row">
      <div>
        <label htmlFor={id} className="toggle-row__label">
          {label}
        </label>
        {description && <p className="toggle-row__desc">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        className="switch"
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  );
}
