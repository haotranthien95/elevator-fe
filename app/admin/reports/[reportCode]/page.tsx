import { notFound } from "next/navigation";
import { getAdminWorkOrderByCodeServer } from "@/lib/admin-server";
import { ReportDetailClient } from "./report-detail-client";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportCode: string }>;
}) {
  const { reportCode } = await params;
  const workOrder = await getAdminWorkOrderByCodeServer(decodeURIComponent(reportCode));

  if (!workOrder) {
    notFound();
  }

  return <ReportDetailClient workOrder={workOrder} />;
}
