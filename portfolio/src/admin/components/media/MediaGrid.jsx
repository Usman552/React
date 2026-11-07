import { formatBytes } from "../../lib/media";
import Icon from "../Icon";
import { Badge } from "../ui";

/** Grid of stored files. Used by the media library and the media picker. */
export default function MediaGrid({ items, usage, selected, onSelect }) {
  return (
    <div className="media-grid">
      {items.map((item, i) => {
        const used = usage?.get(item.path)?.length || 0;
        const isSelected = selected === item.path;
        return (
          <button
            key={item.path}
            type="button"
            className={`asset ${isSelected ? "is-selected" : ""}`}
            style={{ "--i": i }}
            onClick={() => onSelect(item)}
            aria-pressed={isSelected}
            title={item.path}
          >
            <span className="asset__preview">
              {item.isImage ? <img src={item.url} alt="" loading="lazy" /> : <Icon name="file" size={30} />}
            </span>
            {usage && (
              <span className="asset__flags">
                {used > 0 ? <Badge tone="success">In use</Badge> : <Badge>Unused</Badge>}
              </span>
            )}
            {isSelected && (
              <span className="asset__check" aria-hidden="true">
                <Icon name="check" size={13} />
              </span>
            )}
            <span className="asset__body">
              <span className="asset__name">{item.name}</span>
              <span className="asset__meta">
                <span>{item.folder}</span>·<span>{formatBytes(item.size)}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
