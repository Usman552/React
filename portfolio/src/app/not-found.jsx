import SiteShell from "../components/SiteShell";
import NotFoundPage from "../views/NotFoundPage";

export const metadata = { title: "Page not found" };

/** Unknown URLs outside the site routes still get the site's navbar and footer. */
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundPage />
    </SiteShell>
  );
}
