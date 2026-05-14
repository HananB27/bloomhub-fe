import HRDashboardApp from "@/components/hr-dashboard/App";

interface AssetPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params;

  return <HRDashboardApp initialActiveModule="assets" initialAssetId={id} />;
}
