import { DetailSkeleton } from "@/components/SkeletonLayouts";

export default function AdminOrderDetailLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="skeleton" style={{ width: 140, height: 28, borderRadius: "var(--radius-sm)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="skeleton skeleton-h1" style={{ width: 280 }} />
          <div className="skeleton skeleton-badge" />
          <div className="skeleton skeleton-badge" />
        </div>
      </div>
      <DetailSkeleton />
    </div>
  );
}
