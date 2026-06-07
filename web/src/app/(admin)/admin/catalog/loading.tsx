import { PageHeaderSkeleton, FilterBarSkeleton, TableSkeleton } from "@/components/SkeletonLayouts";

export default function AdminCatalogLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton />
      <FilterBarSkeleton cols={3} />
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
