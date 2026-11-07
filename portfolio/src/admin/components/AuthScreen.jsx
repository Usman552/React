import ThemeSwitch from "./ThemeSwitch";

/** Full-screen backdrop for sign-in and setup screens. */
export default function AuthScreen({ children }) {
  return (
    <div className="auth">
      <div className="hero__mesh" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="hero__grid" aria-hidden="true" />
      <div className="auth__theme">
        <ThemeSwitch size="sm" />
      </div>
      {children}
    </div>
  );
}
