import { PageHeaderSkeleton, TableSkeleton } from "@/components/SkeletonLayouts";

export default function BranchesLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}
