"use client";

import { Suspense, use } from "react";
import HRDashboardApp from "@/components/hr-dashboard/App";

export default function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const params = use(searchParams);
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <Suspense fallback={null}>
      <HRDashboardApp
        initialModule="projects"
        initialProjectId={rawId ?? null}
      />
    </Suspense>
  );
}
