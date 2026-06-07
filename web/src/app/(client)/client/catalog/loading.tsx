import { PageHeaderSkeleton, FilterBarSkeleton } from "@/components/SkeletonLayouts";

export default function CatalogLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <PageHeaderSkeleton hasButton={false} />
      <FilterBarSkeleton cols={3} />
      {/* Product grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginTop: 8 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="skeleton" style={{ width: "100%", height: 180 }} />
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="skeleton skeleton-text" style={{ width: "80%" }} />
              <div className="skeleton skeleton-text" style={{ width: "50%", height: 11 }} />
              <div className="skeleton skeleton-badge" style={{ marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
