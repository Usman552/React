import { useCallback, useEffect, useState } from "react";
import { describeError } from "../lib/errors";

/**
 * Loads data on mount and on reload(). Pass a stable function (defined at
 * module level or memoised) so it isn't re-run on every render.
 * Returns { data, setData, loading, error, reload }.
 */
export default function useLoad(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loader().then(
      (data) => active && setState({ data, loading: false, error: null }),
      (err) => active && setState({ data: null, loading: false, error: describeError(err) })
    );
    return () => {
      active = false;
    };
  }, [loader, version]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setVersion((v) => v + 1);
  }, []);

  const setData = useCallback(
    (update) => setState((s) => ({ ...s, data: typeof update === "function" ? update(s.data) : update })),
    []
  );

  return { ...state, setData, reload };
}
