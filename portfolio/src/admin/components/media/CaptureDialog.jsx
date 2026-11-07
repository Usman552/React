import { useState } from "react";
import { useToast } from "../../context/hooks";
import { captureScreenshot } from "../../lib/media";
import { TextField } from "../form";
import Icon from "../Icon";
import { Modal } from "../ui";

/**
 * Asks for a page URL and captures it on the server. Calls onCaptured(url)
 * with the stored image's public URL.
 */
export default function CaptureDialog({ open, onClose, onCaptured, initialUrl = "", folder = "library" }) {
  const toast = useToast();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  // Start fresh each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setUrl(initialUrl);
      setResult(null);
    }
  }

  const capture = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const shot = await captureScreenshot(url.trim(), folder);
      setResult(shot);
      onCaptured?.(shot);
      toast.success("Screenshot captured and saved to Media.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Capture a website screenshot" onClose={onClose}>
      <form className="form-stack" onSubmit={capture} noValidate>
        <TextField
          label="Page URL"
          placeholder="https://my-project.vercel.app"
          value={url}
          onChange={setUrl}
          hint="A 1440×900 screenshot is taken on the server. The page must be public."
          autoFocus
          type="url"
        />
        <div className="media-detail__preview" style={{ aspectRatio: "16 / 10", minHeight: 0 }}>
          {busy ? (
            <span className="media__placeholder">
              <Icon name="camera" size={22} className="spin" />
              Opening the page and taking the shot… this can take up to 30 seconds.
            </span>
          ) : result ? (
            <img src={result} alt="Captured screenshot" />
          ) : (
            <span className="media__placeholder">
              <Icon name="camera" size={22} />
              The screenshot will appear here
            </span>
          )}
        </div>
        <div className="modal__actions">
          <button type="button" className="a-btn a-btn--ghost" onClick={onClose}>
            {result ? "Done" : "Cancel"}
          </button>
          <button type="submit" className="a-btn a-btn--primary" disabled={busy || !url.trim()}>
            <Icon name="camera" size={16} /> {busy ? "Capturing…" : result ? "Capture again" : "Capture"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
