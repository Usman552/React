import { useEffect, useMemo, useState } from "react";
import { describeError } from "../../lib/errors";
import { listMedia } from "../../lib/media";
import Icon from "../Icon";
import { EmptyState, ErrorState, Modal, Skeleton } from "../ui";
import MediaGrid from "./MediaGrid";

/** Choose an existing file from the media library. */
export default function MediaPicker({ open, onClose, onPick, kind = "image" }) {
  const [state, setState] = useState({ items: null, error: null });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    listMedia().then(
      (items) => active && setState({ items, error: null }),
      (err) => active && setState({ items: null, error: describeError(err) })
    );
    return () => {
      active = false;
    };
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (state.items || []).filter(
      (item) => (kind === "pdf" ? item.type === "application/pdf" : item.isImage) && (!q || item.path.toLowerCase().includes(q))
    );
  }, [state.items, query, kind]);

  const choose = () => {
    const item = items.find((i) => i.path === selected);
    if (item) onPick(item.url);
    onClose();
  };

  return (
    <Modal open={open} title="Choose from media library" onClose={onClose} size="lg">
      <div className="form-stack">
        <label className="search" style={{ maxWidth: "none" }}>
          <Icon name="search" size={16} />
          <span className="sr-only">Search files</span>
          <input type="search" placeholder="Search by file or folder name" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="card card--flush" style={{ maxHeight: "55vh", overflowY: "auto" }}>
          {state.error && <ErrorState message={state.error} />}
          {!state.items && !state.error && (
            <div style={{ padding: 16 }}>
              <Skeleton lines={4} height={60} />
            </div>
          )}
          {state.items && items.length === 0 && (
            <EmptyState icon="image" title="Nothing here yet" text="Upload files or capture a screenshot in Media first." />
          )}
          {items.length > 0 && <MediaGrid items={items} selected={selected} onSelect={(item) => setSelected(item.path)} />}
        </div>
        <div className="modal__actions" style={{ marginTop: 0 }}>
          <button type="button" className="a-btn a-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="a-btn a-btn--primary" disabled={!selected} onClick={choose}>
            Use this file
          </button>
        </div>
      </div>
    </Modal>
  );
}
