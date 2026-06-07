import { DetailSkeleton } from "@/components/SkeletonLayouts";

export default function EmployeeDetailLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="skeleton" style={{ width: 130, height: 28, borderRadius: "var(--radius-sm)" }} />
        <div className="skeleton skeleton-h1" style={{ width: 220 }} />
      </div>
      <DetailSkeleton />
    </div>
  );
}
