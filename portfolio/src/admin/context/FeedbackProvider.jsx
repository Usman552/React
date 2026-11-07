import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import { ConfirmContext, ToastContext } from "./hooks";

let nextId = 1;

/** Toast notifications and a promise-based confirm dialog. */
export default function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const dialogRef = useRef(null);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === "error" ? 7000 : 4000);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push]
  );

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setConfirmState({ confirmLabel: "Confirm", danger: false, ...options, resolve });
      }),
    []
  );

  useEffect(() => {
    if (confirmState && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [confirmState]);

  const settle = (answer) => {
    confirmState?.resolve(answer);
    setConfirmState(null);
    dialogRef.current?.close();
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast--${t.type}`}>
              <Icon name={t.type === "error" ? "alert" : t.type === "success" ? "check" : "info"} />
              <span>{t.message}</span>
              <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>

        {confirmState && (
          <dialog
            ref={dialogRef}
            className="modal modal--sm"
            aria-labelledby="confirm-title"
            onCancel={(e) => {
              e.preventDefault();
              settle(false);
            }}
          >
            <h2 id="confirm-title" className="modal__title">
              {confirmState.title}
            </h2>
            {confirmState.message && <p className="modal__text">{confirmState.message}</p>}
            <div className="modal__actions">
              <button type="button" className="a-btn a-btn--ghost" onClick={() => settle(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={`a-btn ${confirmState.danger ? "a-btn--danger" : "a-btn--primary"}`}
                onClick={() => settle(true)}
                autoFocus
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </dialog>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
