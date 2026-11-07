import { TextField } from "../form";
import Icon from "../Icon";
import MediaUpload from "../MediaUpload";
import { IconButton } from "../ui";

const MAX_IMAGES = 8;

/** Gallery images with alt text, shown on the project's detail page. */
export default function GalleryEditor({ items, onChange, folder, captureUrl }) {
  const update = (i, values) => onChange(items.map((g, j) => (j === i ? { ...g, ...values } : g)));

  return (
    <div className="gallery-editor">
      {items.map((item, i) => (
        <div key={i} className="gallery-editor__item">
          <MediaUpload label={`Image ${i + 1}`} value={item.url} onChange={(url) => update(i, { url })} folder={folder} captureUrl={captureUrl} />
          <TextField label="Alt text" value={item.alt} onChange={(alt) => update(i, { alt })} max={160} />
          <IconButton
            icon="trash"
            label={`Remove image ${i + 1}`}
            tone="danger"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      {items.length < MAX_IMAGES && (
        <button
          type="button"
          className="a-btn a-btn--ghost a-btn--sm"
          onClick={() => onChange([...items, { url: "", alt: "" }])}
        >
          <Icon name="plus" size={14} /> Add gallery image
        </button>
      )}
    </div>
  );
}
