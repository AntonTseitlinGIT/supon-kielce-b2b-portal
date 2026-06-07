import { ChatSkeleton } from "@/components/SkeletonLayouts";

export default function ClientTicketDetailLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="skeleton" style={{ width: 120, height: 30, borderRadius: "var(--radius-sm)" }} />
        <div className="skeleton skeleton-btn" />
      </div>
      <ChatSkeleton />
    </div>
  );
}
