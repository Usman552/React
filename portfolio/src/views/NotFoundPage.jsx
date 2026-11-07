import Link from "next/link";
import "./ProjectsPage.css";

export default function NotFoundPage() {
  return (
    <section className="section page">
      <div className="container" style={{ textAlign: "center", paddingTop: 60 }}>
        <p className="section-label">404</p>
        <h1 className="section__title">This page doesn&apos;t exist.</h1>
        <p className="section__lead" style={{ marginBottom: 24 }}>
          The link may be old or mistyped.
        </p>
        <Link href="/" className="btn btn--primary">
          Back to home
        </Link>
      </div>
    </section>
  );
}
