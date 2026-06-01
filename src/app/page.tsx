import { Suspense } from "react";
import HRDashboardApp from "@/components/hr-dashboard/App";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HRDashboardApp />
    </Suspense>
  );
}
