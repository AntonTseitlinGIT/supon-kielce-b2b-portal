import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  Truck, 
  FileText, 
  MessageSquare,
  Package 
} from "lucide-react";
import { 
  formatOrderStatus, 
  formatPriority, 
  formatDate, 
  formatShortDate 
} from "@/utils/format";

type Params = Promise<{ id: string }>;

interface PageProps {
  params: Params;
}

export default async function ClientOrderDetailPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await props.params;

  // Fetch order with all nested relations
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      branch: true,
      createdBy: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true, photoUrls: true } },
        },
      },
      deliveries: {
        orderBy: { shippedAt: "desc" },
        include: {
          items: true,
        },
      },
      wzDocuments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Verify authorization
  if (!order || order.clientId !== session.user.clientId) {
    notFound();
  }

  if (session.user.role === "BRANCH_HEAD" && order.branchId !== session.user.branchId) {
    redirect("/client/orders");
  }

  const statusInfo = formatOrderStatus(order.status);
  const priorityInfo = formatPriority(order.priority);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Back button & Breadcrumbs */}
      <div>
        <Link 
          href="/client/orders" 
          className="btn btn-ghost btn-sm" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px",
            background: "transparent",
            color: "var(--muted)",
            boxShadow: "none",
            borderColor: "transparent"
          }}
        >
          <ArrowLeft size={15} /> Powrót do zamówień
        </Link>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "32px", margin: 0, color: "var(--text)", letterSpacing: "-0.03em" }}>
                Zamówienie {order.orderNr}
              </h1>
              <div style={{ display: "flex", gap: "8px" }}>
                <span className={`badge ${statusInfo.className}`} style={{ padding: "4px 12px", height: "auto", fontWeight: 700, borderRadius: "8px", fontSize: "12px" }}>
                  {statusInfo.label}
                </span>
                <span className={`badge ${priorityInfo.className}`} style={{ padding: "4px 12px", height: "auto", fontWeight: 700, borderRadius: "8px", fontSize: "12px" }}>
                  {priorityInfo.label}
                </span>
              </div>
            </div>
            {order.clientRef && (
              <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "6px", marginBottom: 0 }}>
                Referencja klienta: <strong style={{ color: "var(--text)" }}>{order.clientRef}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "28px", alignItems: "start" }}>
        
        {/* Main Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Order Items Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Pozycje zamówienia</h3>
            </div>
            
            <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
              <table className="table">
                <thead>
                  <tr style={{ background: "var(--section-bg)" }}>
                    <th style={{ padding: "14px 20px" }}>Produkt</th>
                    <th style={{ padding: "14px 20px" }}>Artykuł</th>
                    <th style={{ padding: "14px 20px" }}>Rozmiar</th>
                    <th style={{ padding: "14px 20px" }}>Dla pracownika</th>
                    <th style={{ padding: "14px 20px", textAlign: "center" }}>Ilość</th>
                    <th style={{ padding: "14px 20px", textAlign: "center" }}>Wysłano</th>
                    <th style={{ padding: "14px 20px", textAlign: "center" }}>Dostarczono</th>
                    <th style={{ padding: "14px 20px" }}>Uwagi</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <div className="row-12">
                          <div style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            background: "var(--section-bg)",
                            display: "grid",
                            placeItems: "center",
                            color: "var(--muted)",
                            overflow: "hidden",
                            border: "1px solid var(--line)",
                            boxShadow: "var(--shadow-xs)",
                            flexShrink: 0
                          }}>
                            {item.product.photoUrls?.[0] ? (
                              <img 
                                src={item.product.photoUrls[0]} 
                                alt={item.productName} 
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                              />
                            ) : (
                              <Package size={20} />
                            )}
                          </div>
                          <div style={{ fontWeight: 700, color: "var(--text)" }}>{item.productName}</div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "12px", background: "var(--section-bg)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)", color: "var(--muted)" }}>
                          {item.articleNr}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span className="badge badge-neutral" style={{ fontWeight: 700, padding: "4px 10px", background: "var(--section-bg)", border: "1px solid var(--line)", borderRadius: "6px" }}>
                          {item.size}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {item.employeeName ? (
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600 }}>{item.employeeName}</span>
                            {item.employeeId && (
                              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                                ID: {item.employeeId.substring(0, 8)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: "13px", fontStyle: "italic" }}>zbiorczo</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: 700, fontSize: "15px" }}>{item.quantity}</td>
                      <td style={{ padding: "14px 20px", textAlign: "center", color: "var(--muted)", fontWeight: 500 }}>{item.qtySent}</td>
                      <td style={{ padding: "14px 20px", textAlign: "center", color: "var(--ok)", fontWeight: 700, fontSize: "15px" }}>
                        {item.qtyDelivered}
                      </td>
                      <td style={{ padding: "14px 20px", color: "var(--muted)", fontSize: "13px" }}>
                        {item.remarks || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deliveries Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title row-10">
                <Truck size={18} style={{ color: "var(--accent)" }} /> Historia dostaw
              </h3>
            </div>
            
            <div className="card-content">
              {order.deliveries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", border: "1px dashed var(--line)", borderRadius: "12px", background: "var(--section-bg)" }}>
                  <Truck size={36} style={{ color: "var(--muted)", marginBottom: "12px", opacity: 0.6 }} />
                  <h4 style={{ fontWeight: 700, margin: "0 0 6px 0", color: "var(--text)" }}>Brak dostaw</h4>
                  <p style={{ color: "var(--muted)", margin: 0, fontSize: "14px" }}>To zamówienie nie posiada jeszcze zarejestrowanych wysyłek.</p>
                </div>
              ) : (
                <div className="col-20">
                  {order.deliveries.map((delivery) => (
                    <div 
                      key={delivery.id} 
                      style={{ 
                        border: "1px solid var(--line)", 
                        borderRadius: "12px", 
                        padding: "20px",
                        background: "var(--page-bg)",
                        boxShadow: "var(--shadow-sm)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                        <div className="row-10">
                          <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--text)" }}>Dostawa {delivery.deliveryNr}</span>
                          <span className={`badge ${delivery.status === "DELIVERED" ? "badge-success" : "badge-warning"}`} style={{ fontWeight: 700, padding: "2px 8px", borderRadius: "6px" }}>
                            {delivery.status === "DELIVERED" ? "Dostarczono" : "W transporcie"}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                          Wysłano: <strong style={{ color: "var(--text)" }}>{formatShortDate(delivery.shippedAt)}</strong>
                        </div>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "14px 16px", background: "var(--section-bg)", borderRadius: "10px", marginBottom: "16px", fontSize: "13px", border: "1px solid var(--line)" }}>
                        <div>Kurier: <strong style={{ color: "var(--text)" }}>{delivery.carrier}</strong></div>
                        <div>Numer śledzenia: <strong style={{ fontFamily: "monospace", color: "var(--text)", fontWeight: 700 }}>{delivery.trackingNr}</strong></div>
                      </div>

                      <div style={{ fontSize: "13px" }}>
                        <div style={{ fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>Zawartość paczki:</div>
                        <ul style={{ paddingLeft: "20px", color: "var(--muted)", margin: 0, display: "grid", gap: "6px" }}>
                          {delivery.items.map((di) => (
                            <li key={di.id}>
                              {di.productName} ({di.articleNr}) — <strong style={{ color: "var(--text)" }}>{di.quantity} szt.</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Order Info Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Szczegóły zamówienia</h3>
            </div>
            
            <div className="card-content col-24">
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--accent-light)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Oddział i Adres
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px", color: "var(--text)" }}>{order.branch.name}</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px", lineHeight: "1.4" }}>{order.address}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--accent-light)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <User size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Złożył
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px", color: "var(--text)" }}>{order.createdBy.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{order.createdBy.email}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--accent-light)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Data złożenia
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px", color: "var(--text)" }}>{formatDate(order.createdAt)}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--accent-light)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Szacowana dostawa (ETA)
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px", color: order.eta ? "var(--text)" : "var(--muted)" }}>
                    {order.eta ? formatShortDate(order.eta) : "Brak daty"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Card */}
          {order.comments && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title row-8">
                  <MessageSquare size={16} style={{ color: "var(--accent)" }} /> Uwagi
                </h3>
              </div>
              <div className="card-content">
                <p style={{ fontSize: "13px", color: "var(--muted)", background: "var(--section-bg)", padding: "14px", borderRadius: "10px", border: "1px solid var(--line)", margin: 0, lineHeight: "1.5" }}>
                  {order.comments}
                </p>
              </div>
            </div>
          )}

          {/* Documents Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Dokumenty WZ</h3>
            </div>
            
            <div className="card-content">
              {order.wzDocuments.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, fontStyle: "italic" }}>Brak powiązanych dokumentów WZ.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {order.wzDocuments.map((doc) => (
                    <Link 
                      key={doc.id} 
                      href={`/client/documents/${doc.id}`}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        padding: "12px", 
                        borderRadius: "10px", 
                        border: "1px solid var(--line)", 
                        background: "var(--section-bg)", 
                        fontSize: "13px",
                        transition: "all 0.2s ease"
                      }}
                      className="clickable"
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--accent-light)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <FileText size={16} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span style={{ fontWeight: 700, color: "var(--text)" }}>{doc.wzNr}</span>
                        <span style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                          {formatShortDate(doc.date)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
