import { PageHeaderSkeleton, TableSkeleton } from "@/components/SkeletonLayouts";

export default function UsersLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeaderSkeleton />
      <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "24px" }}>
        <TableSkeleton rows={8} cols={6} />
        <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="skeleton skeleton-title" style={{ width: "60%" }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div className="skeleton skeleton-text" style={{ width: "40%" }} />
              <div className="skeleton" style={{ height: "38px", borderRadius: "8px" }} />
            </div>
          ))}
          <div className="skeleton skeleton-btn" style={{ width: "100%", height: "38px" }} />
        </div>
      </div>
    </div>
  );
}
