import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ProfileForm from "@/components/ProfileForm";

export default async function ClientProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      <PageHeader
        title="Twój Profil i Ustawienia Konta"
        subtitle="Zarządzaj swoimi danymi osobowymi oraz hasłem dostępowym do portalu"
      />

      <div className="container" style={{ padding: 0 }}>
        <ProfileForm
          user={{
            id: session.user.id,
            name: session.user.name ?? "",
            email: session.user.email ?? "",
            role: session.user.role,
            clientName: session.user.clientName,
            branchName: session.user.branchName,
          }}
        />
      </div>
    </div>
  );
}
