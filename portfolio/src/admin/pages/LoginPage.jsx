import { useState } from "react";
import { Navigate } from "react-router";
import AuthScreen from "../components/AuthScreen";
import Icon from "../components/Icon";
import { useAuth } from "../context/hooks";
import { describeError } from "../lib/errors";
import NotAuthorizedPage from "./NotAuthorizedPage";

export default function LoginPage() {
  const { status, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "admin") return <Navigate to="/admin" replace />;
  if (status === "not-admin") return <NotAuthorizedPage />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(
        err.message === "Invalid login credentials" ? "Email or password is incorrect." : describeError(err)
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen>
      <form className="auth__card" onSubmit={submit}>
        <span className="sidebar__logo auth__logo" aria-hidden="true">
          U
        </span>
        <div>
          <h1 className="auth__title">Welcome back</h1>
          <p className="auth__text" style={{ marginTop: 6 }}>
            Sign in to Portfolio Studio. Admin access only.
          </p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="login-password">
            Password
          </label>
          <div className="password">
            <input
              id="login-password"
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
            </button>
          </div>
        </div>

        {error && (
          <p className="auth__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="a-btn a-btn--primary a-btn--block" disabled={busy}>
          {busy ? (
            <>
              <Icon name="refresh" size={16} className="spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <a className="auth__back" href="/">
          ← Back to portfolio
        </a>
      </form>
    </AuthScreen>
  );
}
