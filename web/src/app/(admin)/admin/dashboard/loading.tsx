import { KpiRowSkeleton, ChartAreaSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/SkeletonLayouts";

export default function AdminDashboardLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <PageHeaderSkeleton hasButton={false} />
      <div className="container" style={{ padding: 0 }}>
        <KpiRowSkeleton />
        <ChartAreaSkeleton />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 20 }}>
          <TableSkeleton rows={5} cols={4} />
          <TableSkeleton rows={5} cols={4} />
        </div>
      </div>
    </div>
  );
}
