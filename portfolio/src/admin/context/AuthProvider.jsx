import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./hooks";

/**
 * status: "loading" | "signed-out" | "not-admin" | "admin"
 * The admin check here only decides what to render. The database enforces
 * the same rule on every query through RLS.
 */
export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");

  const resolve = useCallback(async (nextSession) => {
    setSession(nextSession);
    if (!nextSession) {
      setStatus("signed-out");
      return;
    }
    const { data, error } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", nextSession.user.id)
      .maybeSingle();
    setStatus(!error && data ? "admin" : "not-admin");
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => active && resolve(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION") return;
      // Defer so we don't query inside the auth callback (supabase-js advice).
      setTimeout(() => active && resolve(nextSession), 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [resolve]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, status, signIn, signOut }),
    [session, status, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
