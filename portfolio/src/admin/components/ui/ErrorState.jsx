import Icon from "../Icon";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="empty empty--error">
      <span className="empty__icon">
        <Icon name="alert" size={22} />
      </span>
      <p className="empty__title">Couldn't load this page</p>
      <p className="empty__text">{message}</p>
      {onRetry && (
        <button type="button" className="a-btn a-btn--ghost" onClick={onRetry}>
          <Icon name="refresh" size={16} /> Try again
        </button>
      )}
    </div>
  );
}
