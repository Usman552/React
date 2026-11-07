import { accentThemes } from "../data/site";
import { loadPublicContent } from "../lib/publicContent";
import { buildSiteMetadata } from "../lib/siteMetadata";
import { fontVariables } from "./fonts";

/**
 * Applies the visitor's theme before first paint so there is no flash.
 * A saved choice wins while switching is allowed; otherwise the default
 * mode from Admin → Settings → Appearance applies ("system" follows the OS).
 */
function themeScript({ mode, allow_toggle }) {
  return `(function () {
  var mode = ${JSON.stringify(mode)}, allow = ${allow_toggle ? "true" : "false"};
  try {
    var saved = allow ? localStorage.getItem("portfolio-theme") : null;
    var theme = saved === "light" || saved === "dark"
      ? saved
      : mode === "light" || mode === "dark"
        ? mode
        : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", mode === "light" ? "light" : "dark");
  }
})();`;
}

export async function generateMetadata() {
  return buildSiteMetadata(await loadPublicContent());
}

export const viewport = {
  themeColor: "#0a0d17",
};

export default async function RootLayout({ children }) {
  // Cached and shared with the pages, so this adds no extra request.
  const { settings } = await loadPublicContent();
  const theme = settings.theme;
  const accent = accentThemes[theme.accent] ? theme.accent : "aurora";

  return (
    // The theme script changes data-theme before React hydrates.
    <html
      lang="en"
      data-theme={theme.mode === "light" ? "light" : "dark"}
      data-accent={accent}
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(theme) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
