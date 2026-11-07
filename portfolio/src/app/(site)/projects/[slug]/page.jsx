import { notFound } from "next/navigation";
import { loadPublicContent } from "../../../../lib/publicContent";
import { safeUrl } from "../../../../lib/url";
import ProjectPage from "../../../../views/ProjectPage";

async function findProject(params) {
  const { slug } = await params;
  const { projects } = await loadPublicContent();
  return projects.find((p) => p.slug === slug) ?? null;
}

/** Pre-renders every published project; new ones render on first visit. */
export async function generateStaticParams() {
  const { projects } = await loadPublicContent();
  return projects.map((p) => ({ slug: p.slug }));
}

/** Per-project title, description and preview image for Google and link previews. */
export async function generateMetadata({ params }) {
  const project = await findProject(params);
  if (!project) return { title: "Project not found" };

  const image = safeUrl(project.thumbnail_url);
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      type: "article",
      title: project.title,
      description: project.summary,
      images: image ? [image] : undefined,
    },
    twitter: { card: "summary_large_image", title: project.title, description: project.summary },
  };
}

export default async function Page({ params }) {
  const project = await findProject(params);
  if (!project) notFound();
  return <ProjectPage slug={project.slug} />;
}
