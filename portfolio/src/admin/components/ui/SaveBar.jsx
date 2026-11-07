/** Save bar pinned to the bottom of long forms. */
export default function SaveBar({ dirty, saving, onReset, label = "Save changes" }) {
  return (
    <div className={`save-bar ${dirty ? "is-dirty" : ""}`}>
      <span className="save-bar__status">{dirty ? "You have unsaved changes" : "All changes saved"}</span>
      <div className="save-bar__actions">
        {onReset && (
          <button type="button" className="a-btn a-btn--ghost" onClick={onReset} disabled={!dirty || saving}>
            Discard
          </button>
        )}
        <button type="submit" className="a-btn a-btn--primary" disabled={!dirty || saving}>
          {saving ? "Saving…" : label}
        </button>
      </div>
    </div>
  );
}
