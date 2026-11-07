import { useEffect, useId, useRef } from "react";
import IconButton from "./IconButton";

export default function Modal({ open, title, onClose, children, footer, size = "md" }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() focuses the close button; start in the first field instead,
      // once the browser has finished its own dialog focusing.
      requestAnimationFrame(() =>
        dialog.querySelector(".modal__body :is(input:not([type=hidden]):not(.sr-only), textarea, select)")?.focus()
      );
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open && (
        <>
          <div className="modal__head">
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            <IconButton icon="x" label="Close" onClick={onClose} />
          </div>
          <div className="modal__body">{children}</div>
          {footer && <div className="modal__actions">{footer}</div>}
        </>
      )}
    </dialog>
  );
}
