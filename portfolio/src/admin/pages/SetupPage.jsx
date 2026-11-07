import AuthScreen from "../components/AuthScreen";

/** Shown when the build has no Supabase configuration. */
export default function SetupPage() {
  return (
    <AuthScreen>
      <div className="auth__card auth__card--wide">
        <h1 className="auth__title">Connect a backend</h1>
        <p className="auth__text">
          The admin dashboard needs Supabase. Add these to <code>.env.local</code> and restart the dev server:
        </p>
        <pre className="code-block">
          {"NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:64321\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key"}
        </pre>
        <p className="auth__text">
          Locally, run <code>npm run db:start</code> and copy the values it prints. See the README for production
          setup.
        </p>
        <a className="auth__back" href="/">
          ← Back to portfolio
        </a>
      </div>
    </AuthScreen>
  );
}
