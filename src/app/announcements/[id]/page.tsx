"use client";

import { useParams } from "next/navigation";
import HRDashboardApp from "@/components/hr-dashboard/App";

export default function AnnouncementPage() {
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const announcementId = Number(rawId);
  const initialAnnouncementId =
    Number.isInteger(announcementId) && announcementId > 0
      ? announcementId
      : undefined;

  return <HRDashboardApp initialAnnouncementId={initialAnnouncementId} />;
}
