import "../../admin/admin.css";

export const metadata = {
  title: "Admin · Portfolio",
  robots: { index: false, follow: false },
};

// Scopes the admin styles (:root[data-admin]) and applies the admin's own
// light/dark choice before first paint, so there is no theme flash.
const ADMIN_SCRIPT = `(function () {
  var root = document.documentElement;
  root.setAttribute("data-admin", "");
  var pref = "system";
  try { pref = localStorage.getItem("portfolio-admin-theme") || "system"; } catch (e) {}
  var dark = pref === "dark" || (pref !== "light" && !window.matchMedia("(prefers-color-scheme: light)").matches);
  root.setAttribute("data-admin-theme", dark ? "dark" : "light");
})();`;

export default function AdminLayout({ children }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ADMIN_SCRIPT }} />
      {children}
    </>
  );
}
