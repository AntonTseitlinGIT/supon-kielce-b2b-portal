import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ProfileForm from "@/components/ProfileForm";

export default async function AdminProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      <PageHeader
        title="Mój Profil Menedżera"
        subtitle="Zarządzaj swoimi danymi osobowymi oraz hasłem konta administracyjnego"
      />

      <div className="container" style={{ padding: 0 }}>
        <ProfileForm
          user={{
            id: session.user.id,
            name: session.user.name ?? "",
            email: session.user.email ?? "",
            role: session.user.role,
          }}
        />
      </div>
    </div>
  );
}
