import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Icon from "../components/Icon";
import CaptureDialog from "../components/media/CaptureDialog";
import MediaGrid from "../components/media/MediaGrid";
import { Badge, EmptyState, ErrorState, Modal, PageHeader, Skeleton } from "../components/ui";
import { useConfirm, useToast } from "../context/hooks";
import useLoad from "../hooks/useLoad";
import { describeError } from "../lib/errors";
import { formatDateTime, plural } from "../lib/format";
import { deleteMedia, findUsage, formatBytes, listMedia } from "../lib/media";
import { ACCEPT_IMAGES, ACCEPT_PDF, uploadMedia } from "../lib/upload";

async function loadMedia() {
  const [items, usage] = await Promise.all([listMedia(), findUsage()]);
  return { items, usage };
}

const FILTERS = [
  ["all", "All"],
  ["images", "Images"],
  ["docs", "Documents"],
  ["unused", "Unused"],
];

function AssetDetail({ item, usage, onClose, onDelete }) {
  const toast = useToast();
  const used = usage.get(item.path) || [];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it by hand.");
    }
  };

  return (
    <div className="media-detail">
      <div className="media-detail__preview">
        {item.isImage ? <img src={item.url} alt="" /> : <Icon name="file" size={40} />}
      </div>
      <div className="form-stack">
        <dl className="kv">
          <dt>File</dt>
          <dd className="mono small">{item.path}</dd>
          <dt>Size</dt>
          <dd>{formatBytes(item.size)}</dd>
          <dt>Type</dt>
          <dd>{item.type || "—"}</dd>
          <dt>Added</dt>
          <dd>{formatDateTime(item.created_at)}</dd>
        </dl>
        <div>
          <p className="field__label" style={{ marginBottom: 8 }}>
            Used in
          </p>
          {used.length ? (
            <ul className="usage-list">
              {used.map((u) => (
                <li key={`${u.label}-${u.to}`}>
                  <Icon name="link" size={14} />
                  <Link to={u.to} className="link" onClick={onClose}>
                    {u.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Not used anywhere on the site. Safe to delete.</p>
          )}
        </div>
        <div className="inline-actions">
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={copy}>
            <Icon name="copy" size={14} /> Copy link
          </button>
          <a className="a-btn a-btn--ghost a-btn--sm" href={item.url} target="_blank" rel="noreferrer">
            <Icon name="external" size={14} /> Open
          </a>
          <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" onClick={() => onDelete(item, used)}>
            <Icon name="trash" size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useLoad(loadMedia);
  const [filter, setFilter] = useState("all");
  const [folder, setFolder] = useState("all");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const captureOpen = params.get("capture") === "1";

  const setCaptureOpen = (open) =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      if (open) next.set("capture", "1");
      else next.delete("capture");
      return next;
    });

  const folders = useMemo(() => [...new Set((data?.items || []).map((i) => i.folder))].sort(), [data]);
  const totalBytes = useMemo(() => (data?.items || []).reduce((sum, i) => sum + i.size, 0), [data]);
  const unusedCount = useMemo(() => (data?.items || []).filter((i) => !data.usage.get(i.path)).length, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.items.filter((item) => {
      const byType =
        filter === "all" ||
        (filter === "images" && item.isImage) ||
        (filter === "docs" && !item.isImage) ||
        (filter === "unused" && !data.usage.get(item.path));
      return byType && (folder === "all" || item.folder === folder) && (!q || item.path.toLowerCase().includes(q));
    });
  }, [data, filter, folder, query]);

  const upload = async (fileList) => {
    const files = [...(fileList || [])];
    if (!files.length) return;
    setUploading(files.length);
    let done = 0;
    for (const file of files) {
      try {
        await uploadMedia(file, "library", file.type === "application/pdf" ? "pdf" : "image");
        done += 1;
      } catch (err) {
        toast.error(`${file.name}: ${describeError(err, "Upload failed.")}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (done) toast.success(`${plural(done, "file")} uploaded.`);
    if (inputRef.current) inputRef.current.value = "";
    reload();
  };

  const remove = async (item, used) => {
    const ok = await confirm({
      title: `Delete ${item.name}?`,
      message: used.length
        ? `It's still used in ${used.map((u) => u.label).join(", ")}. Those places will show a broken image until you replace it.`
        : "The file is removed from storage. This can't be undone.",
      confirmLabel: "Delete file",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteMedia([item.path]);
      setDetail(null);
      toast.success("File deleted.");
      reload();
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Media"
        description="Every image and document on your portfolio, in one place. See where each file is used before you delete it."
        actions={
          <>
            <button type="button" className="a-btn a-btn--ghost" onClick={() => setCaptureOpen(true)}>
              <Icon name="camera" size={16} /> Capture screenshot
            </button>
            <button type="button" className="a-btn a-btn--primary" onClick={() => inputRef.current?.click()} disabled={uploading > 0}>
              <Icon name="upload" size={16} /> {uploading ? `Uploading ${uploading}…` : "Upload files"}
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={`${ACCEPT_IMAGES},${ACCEPT_PDF}`}
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => upload(e.target.files)}
            />
          </>
        }
      />

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton lines={6} height={40} />}

      {data && (
        <div
          className="card card--flush"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => e.currentTarget.contains(e.relatedTarget) || setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files);
          }}
        >
          <div className="toolbar">
            <label className="search">
              <Icon name="search" size={16} />
              <span className="sr-only">Search files</span>
              <input type="search" placeholder="Search by file or folder" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <div className="segmented" role="group" aria-label="Filter files">
              {FILTERS.map(([key, label]) => (
                <button key={key} type="button" aria-pressed={filter === key} className={filter === key ? "is-active" : ""} onClick={() => setFilter(key)}>
                  {label}
                  {key === "unused" && unusedCount > 0 && ` · ${unusedCount}`}
                </button>
              ))}
            </div>
            <label>
              <span className="sr-only">Folder</span>
              <select className="input input--sm" value={folder} onChange={(e) => setFolder(e.target.value)}>
                <option value="all">All folders</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <span className="toolbar__count">
              {plural(data.items.length, "file")} · {formatBytes(totalBytes)}
            </span>
          </div>

          <div className={`dropzone ${dragging ? "is-dragging" : ""}`}>
            <Icon name="upload" size={18} />
            <span>
              Drop images or PDFs anywhere here. Large photos are resized and converted to WebP automatically.
            </span>
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              icon="image"
              title="Your library is empty"
              text="Upload images, or capture a screenshot of a live project to use as its cover."
            />
          ) : visible.length === 0 ? (
            <EmptyState icon="search" title="No files match" text="Try another filter or search." />
          ) : (
            <MediaGrid items={visible} usage={data.usage} selected={detail?.path} onSelect={setDetail} />
          )}
        </div>
      )}

      <Modal open={Boolean(detail)} title={detail?.name || ""} onClose={() => setDetail(null)} size="lg">
        {detail && data && (
          <>
            {!data.usage.get(detail.path) && (
              <p className="notice" style={{ marginBottom: 16 }}>
                <Badge>Unused</Badge> This file isn't referenced by your profile, settings, projects or experience.
              </p>
            )}
            <AssetDetail item={detail} usage={data.usage} onClose={() => setDetail(null)} onDelete={remove} />
          </>
        )}
      </Modal>

      <CaptureDialog open={captureOpen} onClose={() => setCaptureOpen(false)} onCaptured={() => reload()} />
    </>
  );
}
