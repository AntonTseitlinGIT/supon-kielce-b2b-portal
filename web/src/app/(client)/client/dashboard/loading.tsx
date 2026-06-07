import { KpiRowSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/SkeletonLayouts";

export default function ClientDashboardLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton hasButton={false} />
      <KpiRowSkeleton />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20 }}>
        <TableSkeleton rows={5} cols={4} />
        <TableSkeleton rows={5} cols={3} />
      </div>
    </div>
  );
}
