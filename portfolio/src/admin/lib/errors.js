/** Turns Supabase / PostgREST / function errors into a sentence for a toast. */
export function describeError(error, fallback = "Something went wrong.") {
  if (!error) return fallback;
  if (error.code === "23505") return "That value is already in use. Choose a different one.";
  if (error.code === "23514") return "One of the values isn't allowed. Check the highlighted fields.";
  if (error.code === "42501" || error.status === 401 || error.status === 403) {
    return "You don't have permission to do that. Try signing in again.";
  }
  if (error.message === "Failed to fetch") return "Network error. Check your connection.";
  return error.message || fallback;
}

/** supabase.functions.invoke wraps non-2xx bodies; this unwraps them. */
export async function invokeFunction(supabase, name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return data;

  let message = error.message;
  try {
    const payload = await error.context?.json();
    message = payload?.error || message;
  } catch {
    // Body wasn't JSON; keep the generic message.
  }
  throw new Error(message);
}
