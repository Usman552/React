import { useId, useRef, useState } from "react";
import { useToast } from "../context/hooks";
import { describeError } from "../lib/errors";
import { ACCEPT_IMAGES, ACCEPT_PDF, checkFile, uploadMedia } from "../lib/upload";
import { isSafeUrl, URL_HINT } from "../lib/validation";
import Icon from "./Icon";
import CaptureDialog from "./media/CaptureDialog";
import MediaPicker from "./media/MediaPicker";

/**
 * Upload + preview for one image or PDF. The value is a URL; admins can also
 * pick a file already in the media library, paste a URL (e.g. "/profile.png"),
 * or, with `captureUrl`, take a screenshot of that page.
 */
export default function MediaUpload({ label, hint, value, onChange, folder, kind = "image", aspect = "16 / 9", captureUrl, compact = false }) {
  const id = useId();
  const inputRef = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [picking, setPicking] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const urlError = value && !isSafeUrl(value) ? URL_HINT : null;

  const handleFile = async (file) => {
    const problem = checkFile(file, kind);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      const url = await uploadMedia(file, folder, kind);
      onChange(url);
      toast.success(kind === "pdf" ? "File uploaded. Save to apply it." : "Image uploaded. Save to apply it.");
    } catch (err) {
      toast.error(describeError(err, "Upload failed."));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`field media ${compact ? "media--compact" : ""} ${urlError ? "has-error" : ""}`}>
      <span className="field__label" id={`${id}-label`}>
        {label}
      </span>

      <div
        className={`media__drop ${dragging ? "is-dragging" : ""} ${kind === "pdf" ? "media__drop--file" : ""}`}
        style={kind === "image" ? { aspectRatio: aspect } : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        {value && !urlError ? (
          kind === "image" ? (
            <img src={value} alt="" className="media__preview" />
          ) : (
            <a href={value} target="_blank" rel="noreferrer" className="media__file">
              <Icon name="file" size={20} /> {value.split("/").pop()}
            </a>
          )
        ) : (
          <span className="media__placeholder">
            <Icon name="upload" size={20} />
            {kind === "pdf" ? "Drop a PDF here" : "Drop an image here"}
          </span>
        )}
        {busy && <span className="media__busy">Uploading…</span>}
      </div>

      <div className="media__actions">
        <button
          type="button"
          className="a-btn a-btn--ghost a-btn--sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-describedby={`${id}-label`}
        >
          <Icon name="upload" size={14} /> {value ? "Replace" : "Upload"}
        </button>
        <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setPicking(true)} disabled={busy}>
          <Icon name="image" size={14} /> Library
        </button>
        {captureUrl !== undefined && (
          <button
            type="button"
            className="a-btn a-btn--soft a-btn--sm"
            onClick={() => setCapturing(true)}
            disabled={busy}
            title={captureUrl ? `Screenshot of ${captureUrl}` : "Add a live demo URL first, or enter any URL"}
          >
            <Icon name="camera" size={14} /> Capture
          </button>
        )}
        {value && (
          <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" onClick={() => onChange(null)} disabled={busy}>
            Remove
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={kind === "pdf" ? ACCEPT_PDF : ACCEPT_IMAGES}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <label className="sr-only" htmlFor={id}>
        {label} URL
      </label>
      <input
        id={id}
        className="input input--sm"
        placeholder="…or paste a URL"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-invalid={urlError ? true : undefined}
      />
      {urlError ? <p className="field__error">{urlError}</p> : hint && <p className="field__hint">{hint}</p>}

      <MediaPicker
        open={picking}
        kind={kind}
        onClose={() => setPicking(false)}
        onPick={(url) => {
          onChange(url);
          toast.success("File selected. Save to apply it.");
        }}
      />
      {captureUrl !== undefined && (
        <CaptureDialog
          open={capturing}
          initialUrl={captureUrl || ""}
          folder={folder}
          onClose={() => setCapturing(false)}
          onCaptured={(url) => onChange(url)}
        />
      )}
    </div>
  );
}
