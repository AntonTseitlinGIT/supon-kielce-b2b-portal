import { isSuponRole } from "@/config/permissions.config";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { 
  ArrowLeft, MapPin, User, Calendar, Clock, Truck, FileText, MessageSquare, Package, Building 
} from "lucide-react";
import { formatOrderStatus, formatPriority, formatDate, formatShortDate } from "@/utils/format";
import OrderActions from "./OrderActions";

type Params = Promise<{ id: string }>;

interface PageProps {
  params: Params;
}

export default async function AdminOrderDetailPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;
  if (!isSuponRole(role)) {
    redirect("/client/dashboard");
  }

  const { id } = await props.params;

  // Fetch order with all nested relations
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
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

  if (!order) {
    notFound();
  }

  const statusInfo = formatOrderStatus(order.status);
  const priorityInfo = formatPriority(order.priority);
  
  // Prepare items for OrderActions WZ creation
  const actionItems = order.items.map(item => ({
    id: item.id,
    articleNr: item.articleNr,
    productName: item.productName,
    size: item.size,
    quantity: item.quantity,
    qtySent: item.qtySent,
    qtyDelivered: item.qtyDelivered,
  }));

  const recipientDefault = order.client.name.split("—")[0].trim() + " (" + order.branch.name + ")";

  return (
    <div className="col-24">
      {/* Back link */}
      <div>
        <Link href="/admin/orders" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: "8px" }}>
          <ArrowLeft size={16} style={{ marginRight: "6px" }} /> Powrót do zamówień
        </Link>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "28px", margin: 0 }}>
                Zamówienie {order.orderNr}
              </h1>
              <span className={`badge ${statusInfo.className}`} style={{ fontSize: "13px", padding: "4px 12px" }}>
                {statusInfo.label}
              </span>
              <span className={`badge ${priorityInfo.className}`} style={{ fontSize: "13px", padding: "4px 12px" }}>
                {priorityInfo.label}
              </span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>
              Klient: <strong>{order.client.name}</strong> (NIP: {order.client.nip})
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        
        {/* Main Column */}
        <div className="col-24">
          
          {/* Order Items Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Pozycje zamówienia</h3>
            </div>
            
            <div className="card-content" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produkt</th>
                      <th>Artykuł</th>
                      <th>Rozmiar</th>
                      <th>Dla pracownika</th>
                      <th style={{ textAlign: "center" }}>Ilość</th>
                      <th style={{ textAlign: "center" }}>Wysłano</th>
                      <th style={{ textAlign: "center" }}>Dostarczono</th>
                      <th>Uwagi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="row-10">
                            <div style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "var(--radius-sm)",
                              background: "var(--section-bg)",
                              display: "grid",
                              placeItems: "center",
                              color: "var(--muted)",
                              overflow: "hidden",
                              flexShrink: 0
                            }}>
                              {item.product.photoUrls?.[0] ? (
                                <img 
                                  src={item.product.photoUrls[0]} 
                                  alt={item.productName} 
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                />
                              ) : (
                                <Package size={18} />
                              )}
                            </div>
                            <div style={{ fontWeight: 600 }}>{item.productName}</div>
                          </div>
                        </td>
                        <td style={{ color: "var(--muted)", fontFamily: "monospace" }}>
                          {item.articleNr}
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                            {item.size}
                          </span>
                        </td>
                        <td>
                          {item.employeeName ? (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 500 }}>{item.employeeName}</span>
                              {item.employeeId && (
                                <span style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "monospace" }}>
                                  ID: {item.employeeId.substring(0, 8)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "var(--muted)", fontSize: "13px" }}>brak przypisania</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ textAlign: "center", color: "var(--muted)" }}>{item.qtySent}</td>
                        <td style={{ textAlign: "center", color: "var(--ok)", fontWeight: 500 }}>
                          {item.qtyDelivered}
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: "13px" }}>
                          {item.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Deliveries History */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Historia dostaw</h3>
            </div>
            
            <div className="card-content">
              {order.deliveries.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>
                  <Truck size={36} style={{ color: "var(--muted)", marginBottom: "10px" }} />
                  <h3>Brak zarejestrowanych dostaw</h3>
                  <p>To zamówienie nie posiada jeszcze wygenerowanych wysyłek WZ.</p>
                </div>
              ) : (
                <div className="col-16">
                  {order.deliveries.map((delivery) => (
                    <div 
                      key={delivery.id} 
                      style={{ 
                        border: "1px solid var(--line)", 
                        borderRadius: "var(--radius)", 
                        padding: "16px",
                        background: "var(--bg)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                          <span style={{ fontWeight: 700, marginRight: "8px" }}>Dostawa {delivery.deliveryNr}</span>
                          <span className={`badge ${delivery.status === "DELIVERED" ? "badge-success" : "badge-warning"}`}>
                            {delivery.status === "DELIVERED" ? "Dostarczono" : "W transporcie"}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                          Wysłano: <strong>{formatShortDate(delivery.shippedAt)}</strong>
                        </div>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "12px", background: "var(--page-bg)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", marginBottom: "12px", fontSize: "13px" }}>
                        <div>Kurier: <strong>{delivery.carrier}</strong></div>
                        <div>Numer śledzenia: <strong style={{ fontFamily: "monospace" }}>{delivery.trackingNr}</strong></div>
                      </div>

                      <div style={{ fontSize: "13px" }}>
                        <div style={{ fontWeight: 600, marginBottom: "4px" }}>Zawartość paczki:</div>
                        <ul style={{ paddingLeft: "20px", color: "var(--muted)" }}>
                          {delivery.items.map((di) => (
                            <li key={di.id}>
                              {di.productName} ({di.articleNr}) — <strong>{di.quantity} szt.</strong>
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
        <div className="col-24">
          {/* OrderActions (Change status / Create WZ) */}
          <OrderActions
            orderId={order.id}
            currentStatus={order.status}
            items={actionItems}
            recipientDefault={recipientDefault}
            orderType={order.orderType}
          />

          {/* Details Info Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Szczegóły zamówienia</h3>
            </div>
            
            <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "24px", wordBreak: "break-word" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--accent-light)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Building size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Firma / Klient
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px", color: "var(--text)" }}>{order.client.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>NIP: {order.client.nip}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--accent-light)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <MapPin size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
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
                <div style={{ minWidth: 0, flex: 1 }}>
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
                <div style={{ minWidth: 0, flex: 1 }}>
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
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Przewidywane ETA
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
                <p style={{ fontSize: "13px", color: "var(--muted)", background: "var(--section-bg)", padding: "14px", borderRadius: "10px", border: "1px solid var(--line)", margin: 0, lineHeight: "1.5", wordBreak: "break-word" }}>
                  {order.comments}
                </p>
              </div>
            </div>
          )}

          {/* WZ Documents List Card */}
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
                    <div 
                      key={doc.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between",
                        gap: "12px", 
                        padding: "12px", 
                        borderRadius: "10px", 
                        border: "1px solid var(--line)", 
                        background: "var(--section-bg)", 
                        fontSize: "13px"
                      }}
                    >
                      <Link 
                        href={`/client/documents/${doc.id}`}
                        target="_blank"
                        style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
                      >
                        <FileText size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.wzNr}</span>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                            {formatShortDate(doc.date)}
                          </span>
                        </div>
                      </Link>
                      
                      {doc.pdfUrl && (
                        <a 
                          href={doc.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: "11px", height: "26px", padding: "0 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0, marginTop: 0 }}
                        >
                          PDF
                        </a>
                      )}
                    </div>
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
