import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import AdminThemeProvider from "./context/AdminThemeProvider";
import AuthProvider from "./context/AuthProvider";
import FeedbackProvider from "./context/FeedbackProvider";
import { useAuth } from "./context/hooks";
import { supabaseConfigured } from "./lib/supabase";
import AdminLayout from "./components/AdminLayout";
import { Skeleton } from "./components/ui";
import LoginPage from "./pages/LoginPage";
import NotAuthorizedPage from "./pages/NotAuthorizedPage";
import SetupPage from "./pages/SetupPage";
import OverviewPage from "./pages/OverviewPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import ExperiencePage from "./pages/ExperiencePage";
import MediaPage from "./pages/MediaPage";
import GithubPage from "./pages/GithubPage";
import ServicesPage from "./pages/ServicesPage";
import SkillsPage from "./pages/SkillsPage";
import MessagesPage from "./pages/MessagesPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

/** Client-side gate for rendering only. RLS enforces access on the server. */
function RequireAdmin({ children }) {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <div className="boot">
        <Skeleton lines={3} />
      </div>
    );
  }
  if (status === "signed-out") return <Navigate to="/admin/login" replace />;
  if (status === "not-admin") return <NotAuthorizedPage />;
  return children;
}

const router = createBrowserRouter([
  { path: "/admin/login", element: <LoginPage /> },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/new", element: <ProjectEditorPage /> },
      { path: "projects/:id", element: <ProjectEditorPage /> },
      { path: "experience", element: <ExperiencePage /> },
      { path: "media", element: <MediaPage /> },
      { path: "github", element: <GithubPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "skills", element: <SkillsPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

// Title and noindex come from app/admin/layout.jsx.
export default function AdminApp() {
  return (
    <AdminThemeProvider>
      {supabaseConfigured ? (
        <AuthProvider>
          <FeedbackProvider>
            <RouterProvider router={router} />
          </FeedbackProvider>
        </AuthProvider>
      ) : (
        <SetupPage />
      )}
    </AdminThemeProvider>
  );
}
