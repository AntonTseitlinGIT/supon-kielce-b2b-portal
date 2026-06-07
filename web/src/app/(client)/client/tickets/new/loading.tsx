import { PageHeaderSkeleton, FormSkeleton } from "@/components/SkeletonLayouts";

export default function NewTicketLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeaderSkeleton hasButton={false} />
      <FormSkeleton fields={6} />
    </div>
  );
}
