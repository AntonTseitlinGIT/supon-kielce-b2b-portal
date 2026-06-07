import { PageHeaderSkeleton, FilterBarSkeleton, TableSkeleton } from "@/components/SkeletonLayouts";

export default function DocumentsLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton hasButton={false} />
      <FilterBarSkeleton cols={2} />
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
