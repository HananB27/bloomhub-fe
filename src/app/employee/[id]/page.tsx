"use client";

import { Suspense, use } from "react";
import HRDashboardApp from "@/components/hr-dashboard/App";

export default function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numericId = Number(id);
  const initialEmployeeId = Number.isFinite(numericId) ? numericId : undefined;

  return (
    <Suspense fallback={null}>
      <HRDashboardApp
        initialEmployeeId={initialEmployeeId}
        initialModule="profiles"
      />
    </Suspense>
  );
}
