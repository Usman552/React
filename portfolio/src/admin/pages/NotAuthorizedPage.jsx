import AuthScreen from "../components/AuthScreen";
import { useAuth } from "../context/hooks";

export default function NotAuthorizedPage() {
  const { user, signOut } = useAuth();

  return (
    <AuthScreen>
      <div className="auth__card">
        <h1 className="auth__title">No admin access</h1>
        <p className="auth__text">
          <strong>{user?.email}</strong> is signed in but isn't an administrator of this portfolio.
        </p>
        <p className="auth__text">
          To grant access, run <code>npm run admin:create -- {user?.email || "you@example.com"}</code> with the
          service-role key configured.
        </p>
        <button type="button" className="a-btn a-btn--primary a-btn--block" onClick={signOut}>
          Sign out
        </button>
      </div>
    </AuthScreen>
  );
}
