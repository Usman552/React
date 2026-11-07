import Icon from "../Icon";

export default function IconButton({ icon, label, onClick, disabled, tone, active }) {
  return (
    <button
      type="button"
      className={`icon-btn ${tone ? `icon-btn--${tone}` : ""} ${active ? "is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
