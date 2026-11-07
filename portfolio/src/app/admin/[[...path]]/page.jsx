"use client";

import dynamic from "next/dynamic";

// The dashboard is a browser-only app with its own router (react-router).
// Loading it without SSR keeps it out of the public pages entirely.
const AdminApp = dynamic(() => import("../../../admin/AdminApp"), { ssr: false });

export default function AdminPage() {
  return <AdminApp />;
}
