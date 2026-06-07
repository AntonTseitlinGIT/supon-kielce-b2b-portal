import { PageHeaderSkeleton, FormSkeleton } from "@/components/SkeletonLayouts";

export default function NewOrderLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeaderSkeleton hasButton={false} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        <FormSkeleton fields={7} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormSkeleton fields={3} />
        </div>
      </div>
    </div>
  );
}
