import { DetailSkeleton } from "@/components/SkeletonLayouts";

export default function ClientOrderDetailLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="skeleton" style={{ width: 140, height: 28, borderRadius: "var(--radius-sm)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="skeleton skeleton-h1" style={{ width: 260 }} />
          <div className="skeleton skeleton-badge" />
        </div>
      </div>
      <DetailSkeleton />
    </div>
  );
}
