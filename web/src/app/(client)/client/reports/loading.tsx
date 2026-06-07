import { PageHeaderSkeleton, KpiRowSkeleton, ChartAreaSkeleton } from "@/components/SkeletonLayouts";

export default function ReportsLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton hasButton={false} />
      <KpiRowSkeleton />
      <ChartAreaSkeleton />
    </div>
  );
}
