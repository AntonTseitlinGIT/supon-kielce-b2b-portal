import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { Package } from "lucide-react";

export const metadata = {
  title: "Katalog ŚOI | SUPON Kielce",
};

export default async function AdminCatalogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPON_ADMIN") redirect("/admin/dashboard");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.ppeCategory.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const activeCount = products.filter((p) => p.isActive).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      <PageHeader
        title="Katalog ŚOI i BHP"
        subtitle="Przeglądaj dostępne produkty ochrony indywidualnej. Zarządzanie katalogiem dostępne w portalu Dewelopera."
      />

      <div className="container" style={{ padding: 0 }}>
        {/* Stats row */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div className="card" style={{ flex: "1 1 160px", padding: "16px 20px" }}>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Łącznie towarów</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>{products.length}</div>
          </div>
          <div className="card" style={{ flex: "1 1 160px", padding: "16px 20px" }}>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Aktywnych</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--ok)" }}>{activeCount}</div>
          </div>
          <div className="card" style={{ flex: "1 1 160px", padding: "16px 20px" }}>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Kategorii</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>{categories.length}</div>
          </div>
        </div>

        {/* Product table */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Package size={18} className="muted" />
            <h3 className="card-title" style={{ margin: 0 }}>Wszystkie produkty</h3>
          </div>
          <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nazwa i Kod artykułu</th>
                  <th>Kategoria</th>
                  <th>Dostępne rozmiary</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                      Brak produktów w katalogu.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600 }}>{p.name}</span>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                            Kod: <code>{p.articleNr}</code>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "var(--section-bg)", color: "var(--text)", fontSize: "12px" }}>
                          {p.category.name}
                        </span>
                      </td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.availableSizes.join(", ")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${p.isActive ? "ok" : "err"}`} style={{ fontSize: "12px" }}>
                          {p.isActive ? "Aktywny" : "Zablokowany"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
