// Global tokens and utilities first, so component styles can override them.
import "../index.css";
import ContentProvider from "../context/ContentProvider";
import ThemeProvider from "../context/ThemeProvider";
import { loadPublicContent } from "../lib/publicContent";
import BackToTop from "./BackToTop";
import Footer from "./Footer";
import Navbar from "./Navbar";
import ScrollProgress from "./ScrollProgress";
import WhatsAppButton from "./WhatsAppButton";

/** Public site chrome: background, navbar, footer, with content loaded on the server. */
export default async function SiteShell({ children }) {
  const content = await loadPublicContent();

  return (
    <ThemeProvider mode={content.settings.theme?.mode} allowToggle={content.settings.theme?.allow_toggle !== false}>
      <ContentProvider content={content}>
        <div className="aurora" aria-hidden="true">
          <div className="aurora__grid"></div>
          <div className="aurora__blob aurora__blob--1"></div>
          <div className="aurora__blob aurora__blob--2"></div>
        </div>

        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <ScrollProgress />
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
        <BackToTop />
      </ContentProvider>
    </ThemeProvider>
  );
}
