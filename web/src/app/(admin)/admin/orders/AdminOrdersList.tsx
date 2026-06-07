"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatShortDate } from "@/utils/format";
import { OrderStatus } from "@prisma/client";
import { X, Package, Clock, ShieldCheck, MapPin, Calendar, Check, ExternalLink, Truck, FileText, User } from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  articleNr: string;
  size: string;
  quantity: number;
  qtyDelivered: number;
  qtySent: number;
  employeeName: string | null;
  remarks: string | null;
  product: {
    photoUrls: string[];
  };
}

interface DeliveryItem {
  id: string;
  deliveryId: string;
  articleNr: string;
  productName: string;
  quantity: number;
}

interface Delivery {
  id: string;
  deliveryNr: string;
  orderId: string;
  shippedAt: Date;
  carrier: string;
  trackingNr: string;
  status: "IN_TRANSIT" | "DELIVERED";
  createdAt: Date;
  items: DeliveryItem[];
}

interface WzDocument {
  id: string;
  wzNr: string;
  date: Date;
  recipient: string;
  carrier: string;
  trackingNr: string;
  status: string;
}

interface Order {
  id: string;
  orderNr: string;
  status: OrderStatus;
  createdAt: Date;
  eta: Date | null;
  clientRef: string | null;
  address: string;
  client: {
    id: string;
    name: string;
    nip: string;
  };
  branch: {
    id: string;
    name: string;
  };
  items: OrderItem[];
  deliveries: Delivery[];
  wzDocuments: WzDocument[];
  orderType: "STANDARD" | "EXCHANGE" | "COMPLAINT";
}

interface AdminOrdersListProps {
  orders: Order[];
}

export default function AdminOrdersList({ orders }: AdminOrdersListProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status dot tracker helper matching demo's look
  const getStatusTracker = (orderStatus: OrderStatus) => {
    let activeDots = 1;
    let label = "W REALIZACJI";
    let color = "var(--text)";
    let isZatwierdzone = false;

    if (orderStatus === "DRAFT") {
      activeDots = 0;
      label = "SZKIC";
      color = "var(--muted)";
    } else if (orderStatus === "IN_PROGRESS") {
      activeDots = 1;
      label = "W REALIZACJI";
      color = "var(--text)";
    } else if (orderStatus === "PARTIALLY_SENT") {
      activeDots = 2;
      label = "CZĘŚCIOWO WYSŁANE";
      color = "#b45309";
    } else if (orderStatus === "SENT") {
      activeDots = 2;
      label = "WYSŁANE";
      color = "var(--info)";
    } else if (orderStatus === "DELIVERED") {
      activeDots = 3;
      label = "DOSTARCZONE";
      color = "var(--ok)";
    } else if (orderStatus === "APPROVED") {
      activeDots = 4;
      label = "ZREALIZOWANE";
      color = "var(--accent)";
      isZatwierdzone = true;
    } else if (orderStatus === "CANCELLED") {
      activeDots = 0;
      label = "ANULOWANE";
      color = "var(--err)";
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
        {[1, 2, 3, 4].map((dot) => {
          const isActive = activeDots >= dot;
          return (
            <span
              key={dot}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                flexShrink: 0,
                background: isActive ? "var(--accent)" : "var(--line)",
                boxShadow: isZatwierdzone && isActive ? "0 0 0 3px color-mix(in oklab, var(--accent) 20%, transparent)" : "none",
                transition: "all 0.3s ease",
              }}
            />
          );
        })}
        <span style={{ marginLeft: "4px", color, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>
          {isZatwierdzone && "✓ "}{label}
        </span>
      </div>
    );
  };

  // Get active step index for modal stepper
  const getActiveStep = (orderStatus: OrderStatus) => {
    if (orderStatus === "APPROVED") return 4;
    if (orderStatus === "DELIVERED") return 3;
    if (orderStatus === "SENT" || orderStatus === "PARTIALLY_SENT") return 2;
    return 1; // IN_PROGRESS or DRAFT
  };

  return (
    <>
      <div className="table-wrapper" style={{ overflowX: "auto" }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "960px" }}>
          <thead>
            <tr style={{ background: "var(--section-bg)", borderBottom: "2px solid var(--line)" }}>
              <th>Numer</th>
              <th>Klient</th>
              <th>Oddział</th>
              <th>Referencja</th>
              <th>Zawartość</th>
              <th>Status</th>
              <th>ETA</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const firstItem = order.items[0];
              const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
              const deliveredQty = order.items.reduce((sum, it) => sum + it.qtyDelivered, 0);
              const shippedQty = order.items.reduce((sum, it) => sum + it.qtySent, 0);

              const activeShipments = order.deliveries ? order.deliveries.filter(d => d.status === "IN_TRANSIT") : [];
              
              let contentsLabel: React.ReactNode = firstItem 
                ? `${order.items.length} poz: ${firstItem.productName}...`
                : "—";

              if (firstItem) {
                const deliveredPct = totalQty > 0 ? Math.round((deliveredQty / totalQty) * 100) : 0;
                const inTransitPct = totalQty > 0 ? Math.round((shippedQty / totalQty) * 100) : 0;

                contentsLabel = (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 }}>
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {order.items.length > 1 ? `${order.items.length} poz.: ` : ""}{firstItem.productName}
                    </span>

                    {totalQty > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {/* Segmented Progress Bar */}
                        <div style={{ position: "relative", width: "80px", height: "6px", borderRadius: "99px", background: "var(--line)", flexShrink: 0, overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${deliveredPct}%`, background: "var(--ok)" }} />
                          <div style={{ position: "absolute", left: `${deliveredPct}%`, top: 0, height: "100%", width: `${inTransitPct}%`, background: "#f59e0b" }} />
                        </div>
                        {/* Badges breakdown */}
                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                          {deliveredQty > 0 && (
                            <span title="Odebrane" style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "10px", fontWeight: 800, padding: "1px 5px", borderRadius: "5px", background: "rgba(22, 163, 74, 0.08)", color: "var(--ok)", border: "1px solid rgba(22, 163, 74, 0.15)", whiteSpace: "nowrap" }}>
                              ✓ {deliveredQty}
                            </span>
                          )}
                          {shippedQty > 0 && (
                            <span title="W drodze" style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "10px", fontWeight: 800, padding: "1px 5px", borderRadius: "5px", background: "rgba(217, 119, 6, 0.08)", color: "#d97706", border: "1px solid rgba(217, 119, 6, 0.15)", whiteSpace: "nowrap" }}>
                              🚚 {shippedQty}
                            </span>
                          )}
                          {totalQty - deliveredQty - shippedQty > 0 && (
                            <span title="Oczekujące" style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "10px", fontWeight: 800, padding: "1px 5px", borderRadius: "5px", background: "rgba(106, 112, 123, 0.08)", color: "var(--muted)", border: "1px solid rgba(106, 112, 123, 0.15)", whiteSpace: "nowrap" }}>
                              🕒 {totalQty - deliveredQty - shippedQty}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <tr
                  key={order.id}
                  style={{ borderBottom: "1px solid var(--line)", transition: "background 0.2s ease", cursor: "pointer" }}
                  onClick={() => setSelectedOrder(order)}
                  className="clickable-row"
                >
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "13px" }}>{order.orderNr}</span>
                      {order.orderType === "EXCHANGE" && (
                        <span className="badge" style={{ background: "#f3e8ff", color: "#6b21a8", fontSize: "10px", padding: "1px 6px" }}>WYMIANA</span>
                      )}
                      {order.orderType === "COMPLAINT" && (
                        <span className="badge" style={{ background: "#ffedd5", color: "#9a3412", fontSize: "10px", padding: "1px 6px" }}>REKLAMACJA</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: "13px" }}>
                    {order.client.name.split("—")[0].trim()}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "13px" }}>
                    {order.branch.name}
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "13px" }}>
                    {order.clientRef || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: "13px" }}>
                    {contentsLabel}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {getStatusTracker(order.status)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text)", fontWeight: 500, fontSize: "13px", whiteSpace: "nowrap" }}>
                    {formatShortDate(order.eta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DIALOG DISPLAY */}
      {selectedOrder && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(2, 6, 23, 0.45)",
          backdropFilter: "blur(4px)",
          display: "grid",
          placeItems: "center",
          zIndex: 1000
        }}>
          <div 
            style={{
              width: "min(1080px, 96vw)",
              background: "var(--page-bg)",
              border: "1px solid var(--line)",
              borderRadius: "24px",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
              animation: "scaleUp 0.15s ease-out"
            }}
          >
            {/* Header */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>Szczegóły zamówienia {selectedOrder.orderNr}</h3>
                  {selectedOrder.orderType === "EXCHANGE" && (
                    <span className="badge" style={{ background: "#f3e8ff", color: "#6b21a8", fontSize: "11px", padding: "2px 8px" }}>WYMIANA</span>
                  )}
                  {selectedOrder.orderType === "COMPLAINT" && (
                    <span className="badge" style={{ background: "#ffedd5", color: "#9a3412", fontSize: "11px", padding: "2px 8px" }}>REKLAMACJA</span>
                  )}
                </div>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>Klient: <strong>{selectedOrder.client.name}</strong></span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--muted)" }}
                aria-label="Zamknij"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "32px", maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Stepper Pipeline */}
              <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 32px", background: "var(--section-bg)", borderRadius: "16px", border: "1px solid var(--line)" }}>
                {/* Stepper progress track wrapper */}
                <div style={{
                  position: "absolute",
                  top: "38px", // Vertically center of the 28px circles (24px padding + 14px radius = 38px)
                  left: "64px",
                  right: "64px",
                  height: "2px",
                  zIndex: 0
                }}>
                  {/* Background track */}
                  <div style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--line)"
                  }} />
                  {/* Active track */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${((getActiveStep(selectedOrder.status) - 1) / 3) * 100}%`,
                    background: "var(--accent)",
                    transition: "width 0.3s ease"
                  }} />
                </div>

                {[
                  { step: 1, label: "PRZYJĘTE" },
                  { step: 2, label: "W DRODZE" },
                  { step: 3, label: "ODEBRANE" },
                  { step: 4, label: "ZREALIZOWANE" }
                ].map((s) => {
                  const activeStep = getActiveStep(selectedOrder.status);
                  const isActive = activeStep >= s.step;
                  
                  return (
                    <div key={s.step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1, zIndex: 1, position: "relative" }}>
                      <div style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isActive ? "var(--accent)" : "var(--line)",
                        color: isActive ? "#fff" : "var(--muted)",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "grid",
                        placeItems: "center",
                        border: "4px solid var(--section-bg)", // masks the background line!
                        boxShadow: isActive ? "0 0 0 1px var(--accent)" : "0 0 0 1px var(--line)",
                        transition: "all 0.3s ease",
                      }}>
                        {s.step}
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: isActive ? "var(--text)" : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Status Banners */}
              {selectedOrder.status === "IN_PROGRESS" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: "13px", fontWeight: 600 }}>
                  <Clock size={18} style={{ color: "#3b82f6", flexShrink: 0 }} />
                  <span>Zamówienie zostało zaakceptowane. Trwa kompletowanie odzieży w magazynie.</span>
                </div>
              )}

              {selectedOrder.status === "SENT" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "12px", background: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309", fontSize: "13px", fontWeight: 600 }}>
                  <Package size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                  <span>Zamówienie zostało wysłane. Oczekuje na dostarczenie przesyłki.</span>
                </div>
              )}

              {selectedOrder.status === "DELIVERED" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "13px", fontWeight: 600 }}>
                  <ShieldCheck size={18} style={{ color: "var(--ok)", flexShrink: 0 }} />
                  <span>Wszystkie pozycje zamówienia zostały dostarczone do oddziału.</span>
                </div>
              )}

              {selectedOrder.status === "APPROVED" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "13px", fontWeight: 600 }}>
                  <ShieldCheck size={18} style={{ color: "var(--ok)", flexShrink: 0 }} />
                  <span>Zamówienie zostało w pełni zrealizowane, a odbiór zatwierdzony.</span>
                </div>
              )}

              {/* Two Column details layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                
                {/* Left Column: Items and Deliveries */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", borderBottom: "1px solid var(--line)", paddingBottom: "8px", margin: 0 }}>
                      Pozycje zamówienia
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "12px", background: "var(--bg)" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--section-bg)", overflow: "hidden", display: "grid", placeItems: "center", color: "var(--muted)", flexShrink: 0 }}>
                            {item.product.photoUrls?.[0] ? (
                              <img src={item.product.photoUrls[0]} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <Package size={18} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "13.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.productName}</div>
                            <div style={{ fontSize: "11px", color: "var(--muted)" }}>Rozmiar: {item.size} | Pracownik: {item.employeeName || "brak"}</div>
                          </div>
                          <div style={{ textAlign: "right", fontSize: "13px" }}>
                            <div>Suma: <strong>{item.quantity} szt.</strong></div>
                            <div style={{ fontSize: "11px", color: "var(--ok)" }}>Odebrano: {item.qtyDelivered}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipments / Deliveries History */}
                  <div style={{ marginTop: "8px" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", borderBottom: "1px solid var(--line)", paddingBottom: "8px", margin: "0 0 12px 0" }}>
                      Historia wysyłek WZ
                    </h4>
                    {selectedOrder.deliveries.length === 0 ? (
                      <div style={{ fontSize: "13px", color: "var(--muted)", padding: "10px 0" }}>Brak zarejestrowanych wysyłek dla tego zamówienia.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {selectedOrder.deliveries.map((del) => (
                          <div key={del.id} style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "12px", background: "var(--bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 700 }}>Paczka {del.deliveryNr}</div>
                              <div style={{ fontSize: "11px", color: "var(--muted)" }}>Kurier: {del.carrier} | Nr listu: {del.trackingNr}</div>
                            </div>
                            <span className={`badge ${del.status === "DELIVERED" ? "ok" : "warn"}`} style={{ fontSize: "11px" }}>
                              {del.status === "DELIVERED" ? "Dostarczona" : "W transporcie"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Metagrid */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  
                  {/* Meta Details Group */}
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", borderBottom: "1px solid var(--line)", paddingBottom: "8px", margin: "0 0 16px 0" }}>
                      Szczegóły dostawy
                    </h4>
                    
                    {/* Meta grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "18px", border: "1px solid var(--line)", borderRadius: "16px", background: "var(--section-bg)" }}>
                      <div>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Data złożenia</span>
                        <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>{formatShortDate(selectedOrder.createdAt)}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Przewidywane ETA</span>
                        <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>{formatShortDate(selectedOrder.eta)}</div>
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Adres dostawy</span>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, marginTop: "2px" }}>{selectedOrder.address}</div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Footer with action button pointing to full details manager page */}
            <div style={{ padding: "18px 32px", background: "var(--section-bg)", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary btn-sm">
                Zamknij
              </button>
              <Link href={`/admin/orders/${selectedOrder.id}`} className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Zarządzaj zamówieniem <ExternalLink size={14} />
              </Link>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
