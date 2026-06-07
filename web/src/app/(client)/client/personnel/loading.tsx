import { PageHeaderSkeleton, FilterBarSkeleton, PersonnelTableSkeleton } from "@/components/SkeletonLayouts";

export default function PersonnelLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton />
      <FilterBarSkeleton cols={2} />
      <PersonnelTableSkeleton />
    </div>
  );
}
