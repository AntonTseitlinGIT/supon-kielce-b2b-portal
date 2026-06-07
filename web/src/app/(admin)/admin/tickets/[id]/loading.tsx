import { ChatSkeleton } from "@/components/SkeletonLayouts";

export default function AdminTicketDetailLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="skeleton" style={{ width: 120, height: 28, borderRadius: "var(--radius-sm)" }} />
        <div className="skeleton skeleton-h1" style={{ width: 260 }} />
        <div className="skeleton skeleton-badge" />
      </div>
      <ChatSkeleton />
    </div>
  );
}
