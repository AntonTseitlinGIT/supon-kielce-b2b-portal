import { PageHeaderSkeleton, FilterBarSkeleton, TableSkeleton } from "@/components/SkeletonLayouts";

export default function AdminClientsLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton />
      <FilterBarSkeleton cols={2} />
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
