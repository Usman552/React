import { Suspense } from "react";
import ProjectsPage from "../../../views/ProjectsPage";

export const metadata = {
  title: "Projects",
  description: "Live demos of websites and web apps, grouped by category.",
};

export default function Page() {
  // The category filter reads ?category=… on the client.
  return (
    <Suspense>
      <ProjectsPage />
    </Suspense>
  );
}
