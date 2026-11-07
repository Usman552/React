import { useAdminTheme } from "../context/hooks";
import Icon from "./Icon";

const OPTIONS = [
  ["light", "sun", "Light"],
  ["dark", "moon", "Dark"],
  ["system", "monitor", "Match system"],
];

/** Light / Dark / System switch for the admin's own appearance. */
export default function ThemeSwitch({ size = "md" }) {
  const { preference, setPreference } = useAdminTheme();
  const index = OPTIONS.findIndex(([value]) => value === preference);
  const step = size === "sm" ? 30 : 32;

  return (
    <div className={`theme-switch ${size === "sm" ? "theme-switch--sm" : ""}`} role="radiogroup" aria-label="Admin theme">
      <span className="theme-switch__thumb" style={{ transform: `translateX(${index * step}px)` }} aria-hidden="true" />
      {OPTIONS.map(([value, icon, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          aria-label={label}
          title={label}
          onClick={() => setPreference(value)}
        >
          <Icon name={icon} size={15} />
        </button>
      ))}
    </div>
  );
}
