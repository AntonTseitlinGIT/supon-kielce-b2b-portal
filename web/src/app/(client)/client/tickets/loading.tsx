import { PageHeaderSkeleton, FilterBarSkeleton, TableSkeleton } from "@/components/SkeletonLayouts";

export default function ClientTicketsLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton />
      <FilterBarSkeleton cols={3} />
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
