import { PageHeaderSkeleton, FilterBarSkeleton, TableSkeleton } from "@/components/SkeletonLayouts";

export default function AdminOrdersLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton hasButton={false} />
      <FilterBarSkeleton cols={4} />
      <TableSkeleton rows={10} cols={7} />
    </div>
  );
}
