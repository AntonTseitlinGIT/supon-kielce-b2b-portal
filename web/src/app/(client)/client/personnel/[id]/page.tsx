import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { 
  ArrowLeft, 
  Edit, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Ruler, 
  History, 
  ShoppingBag, 
  Calendar, 
  MapPin, 
  HardDrive,
  Package
} from "lucide-react";
import { 
  formatShortDate, 
  formatDate,
  formatOrderStatus 
} from "@/utils/format";
import DeleteEmployeeButton from "./DeleteEmployeeButton";

type Params = Promise<{ id: string }>;

interface PageProps {
  params: Params;
}

export default async function ClientEmployeeDetailPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await props.params;

  // Query database with complete relation includes
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      branch: true,
      history: { 
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      issuedItems: {
        orderBy: { issuedAt: "desc" },
      },
      ppeLimitUsage: {
        include: {
          ppeLimit: {
            include: {
              category: true,
            },
          },
        },
      },
      orderItemsFor: {
        include: {
          order: {
            select: {
              id: true,
              orderNr: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          order: {
            createdAt: "desc",
          },
        },
        take: 10,
      },
    },
  });

  // Verify access control
  if (!employee || employee.branch.clientId !== session.user.clientId) {
    notFound();
  }

  if (session.user.role === "BRANCH_HEAD" && employee.branchId !== session.user.branchId) {
    redirect("/client/personnel");
  }

  // Parse sizes JSON safely
  const sizes = (employee.sizes as {
    height?: string;
    chest?: string;
    waist?: string;
    shoes?: string;
    clothing?: string;
  }) || {};

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "36px", color: "var(--text)", margin: 0 }}>
                Karta pracownika: {employee.name}
              </h1>
              <span className={`badge ${employee.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`} style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "8px", fontWeight: 700 }}>
                {employee.status === "ACTIVE" ? "Aktywny" : "Nieaktywny"}
              </span>
            </div>
            <p className="subtitle" style={{ fontSize: "14px", margin: "6px 0 0 0", color: "var(--muted)" }}>
              ID: <strong style={{ color: "var(--text)" }}>{employee.employeeNr}</strong> | Oddział: {employee.branch.name}
            </p>
          </div>
          <div className="page-header-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/client/personnel" className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px", height: "42px" }}>
              <ArrowLeft size={16} /> Wróć do listy
            </Link>
            <Link href={`/client/personnel/${employee.id}/edit`} className="btn" style={{ display: "flex", alignItems: "center", gap: "8px", height: "42px", background: "var(--accent)", color: "#fff" }}>
              <Edit size={16} /> Edytuj dane
            </Link>
            <DeleteEmployeeButton employeeId={employee.id} employeeName={employee.name} />
          </div>
        </div>
      </div>

      {/* Profile & Sizes Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "stretch" }}>
        
        {/* Profile Details Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--line)", padding: "24px" }}>
          <h3 className="card-title" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", margin: 0, fontWeight: 700, fontSize: "16px" }}>
            Profil i status
          </h3>
          
          <div style={{ display: "flex", gap: "20px", alignItems: "center", overflow: "hidden" }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "color-mix(in oklab, var(--accent) 12%, var(--page-bg))",
              color: "var(--accent)",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: "28px",
              overflow: "hidden",
              border: "1px solid var(--line)",
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.04)",
              flexShrink: 0
            }}>
              {employee.photoUrl ? (
                <img src={employee.photoUrl} alt={employee.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflow: "hidden", minWidth: 0 }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={employee.name}>{employee.name}</div>
              <div style={{ color: "var(--muted)", fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={employee.jobTitle}>{employee.jobTitle}</div>
            </div>
          </div>


        </div>

        {/* Sizes Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--line)", padding: "24px" }}>
          <h3 className="card-title" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px", margin: 0, display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "16px" }}>
            <Ruler size={18} /> Profil rozmiarowy
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", height: "100%" }}>
            
            <div style={{ padding: "14px", background: "var(--section-bg)", border: "1px solid var(--line)", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Wzrost</span>
              <strong style={{ fontSize: "18px", marginTop: "4px", color: "var(--text)" }}>{sizes.height ? `${sizes.height} cm` : "—"}</strong>
            </div>

            <div style={{ padding: "14px", background: "var(--section-bg)", border: "1px solid var(--line)", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Klatka</span>
              <strong style={{ fontSize: "18px", marginTop: "4px", color: "var(--text)" }}>{sizes.chest ? `${sizes.chest} cm` : "—"}</strong>
            </div>

            <div style={{ padding: "14px", background: "var(--section-bg)", border: "1px solid var(--line)", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Pas</span>
              <strong style={{ fontSize: "18px", marginTop: "4px", color: "var(--text)" }}>{sizes.waist ? `${sizes.waist} cm` : "—"}</strong>
            </div>

            <div style={{ padding: "14px", background: "var(--accent-light)", color: "var(--accent-text)", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gridColumn: "span 2", border: "1px solid color-mix(in oklab, var(--accent) 15%, transparent)" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", opacity: 0.8 }}>Rozmiar odzieży</span>
              <strong style={{ fontSize: "20px", marginTop: "4px" }}>{sizes.clothing || "—"}</strong>
            </div>

            <div style={{ padding: "14px", background: "var(--accent-light)", color: "var(--accent-text)", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", border: "1px solid color-mix(in oklab, var(--accent) 15%, transparent)" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", opacity: 0.8 }}>Rozmiar obuwia</span>
              <strong style={{ fontSize: "20px", marginTop: "4px" }}>{sizes.shoes || "—"}</strong>
            </div>

          </div>
        </div>

      </div>

      {/* Issued Items Card */}
      <div className="card" style={{ border: "1px solid var(--line)", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <HardDrive size={18} /> Aktualne wyposażenie (Wydana odzież robocza)
          </h3>
        </div>

        {employee.issuedItems.length === 0 ? (
          <div className="empty-state" style={{ padding: "60px 24px" }}>
            <Package size={48} style={{ color: "var(--muted)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px 0" }}>Brak wydań</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>Nie zarejestrowano żadnych wydanych artykułów dla tego pracownika.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr style={{ background: "var(--section-bg)", borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "12px 20px" }}>Nazwa artykułu</th>
                  <th style={{ padding: "12px 20px" }}>Numer artykułu</th>
                  <th style={{ padding: "12px 20px" }}>Rozmiar</th>
                  <th style={{ padding: "12px 20px" }}>Data wydania</th>
                  <th style={{ padding: "12px 20px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {employee.issuedItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--text)" }}>{item.name}</td>
                    <td style={{ padding: "14px 20px", fontFamily: "monospace", color: "var(--muted)" }}>{item.articleNr}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span className="badge badge-neutral" style={{ fontWeight: 700, background: "var(--section-bg)", padding: "4px 8px" }}>
                        {item.size}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--muted)" }}>{formatShortDate(item.issuedAt)}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Related Orders */}
      <div className="card" style={{ display: "flex", flexDirection: "column", border: "1px solid var(--line)", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingBag size={18} /> Powiązane zamówienia
          </h3>
        </div>
        
        {employee.orderItemsFor.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: "auto", padding: "40px 20px", fontStyle: "italic" }}>Brak powiązanych zamówień.</p>
        ) : (
          <div className="table-wrapper" style={{ flex: 1, overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr style={{ background: "var(--section-bg)", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ padding: "10px 20px" }}>Numer</th>
                  <th style={{ padding: "10px 20px" }}>Produkt</th>
                  <th style={{ padding: "10px 20px" }}>Rozmiar</th>
                  <th style={{ padding: "10px 20px" }}>Ilość</th>
                  <th style={{ padding: "10px 20px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {employee.orderItemsFor.map((item) => {
                  const statusInfo = formatOrderStatus(item.order.status);
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                        <Link href={`/client/orders/${item.order.id}`} style={{ fontWeight: 700, color: "var(--accent)" }}>
                          {item.order.orderNr}
                        </Link>
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.productName}>
                        {item.productName}
                      </td>
                      <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                        <span className="badge badge-neutral" style={{ padding: "3px 6px", fontSize: "12px" }}>
                          {item.size}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", fontWeight: 600, whiteSpace: "nowrap" }}>{item.quantity} szt.</td>
                      <td style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                        <span className={`badge ${statusInfo.className}`} style={{ fontSize: "11px", fontWeight: 700 }}>
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
