import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Minimal form state: values, field errors and dirty tracking against the
 * last saved snapshot. Warns before leaving the tab with unsaved changes.
 */
export default function useForm(initial) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = useCallback((key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }, []);

  /** Returns an onChange handler for a field: bind("title"). */
  const bind = useCallback((key) => (value) => set(key, value), [set]);

  const reset = useCallback(() => {
    setValues(saved);
    setErrors({});
  }, [saved]);

  /** Call after a successful save with the row the server returned. */
  const commit = useCallback((next) => {
    setSaved(next);
    setValues(next);
    setErrors({});
  }, []);

  return { values, setValues, set, bind, errors, setErrors, dirty, reset, commit };
}
