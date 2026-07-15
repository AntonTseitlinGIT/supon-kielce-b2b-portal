"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatShortDate } from "@/utils/format";
import { OrderStatus } from "@prisma/client";
import { X, Package, Clock, ShieldCheck, MapPin, Calendar, Info, Check, Eye, Copy, ExternalLink, Truck } from "lucide-react";

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
  status: string | null;
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

interface Order {
  id: string;
  orderNr: string;
  status: OrderStatus;
  createdAt: Date;
  eta: Date | null;
  branch: { name: string };
  department: string | null;
  items: OrderItem[];
  deliveries: Delivery[];
  orderType: "STANDARD" | "EXCHANGE" | "COMPLAINT";
}

interface OrdersListClientProps {
  orders: Order[];
}

export default function OrdersListClient({ orders }: OrdersListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Lightbox State
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Tracking Number Popup State
  const [trackingPopup, setTrackingPopup] = useState<{ carrier: string; trackingNr: string; deliveryNr: string } | null>(null);

  // Close topmost overlay on Escape (escape-routes / modal-escape)
  useEffect(() => {
    if (!lightbox && !trackingPopup && !selectedOrder) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightbox) setLightbox(null);
      else if (trackingPopup) setTrackingPopup(null);
      else if (selectedOrder) setSelectedOrder(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, trackingPopup, selectedOrder]);

  // Get carrier tracking URL
  const getCarrierUrl = (carrier: string, trackingNr: string): string => {
    const c = carrier.toLowerCase();
    if (c.includes("dhl")) return `https://www.dhl.com/pl-pl/home/tracking/tracking-parcel.html?submit=1&tracking-id=${trackingNr}`;
    if (c.includes("dpd")) return `https://tracktrace.dpd.com.pl/parcelDetails?p1=${trackingNr}`;
    if (c.includes("inpost") || c.includes("paczkomat")) return `https://inpost.pl/sledzenie-przesylek?number=${trackingNr}`;
    if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${trackingNr}`;
    if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNr}`;
    if (c.includes("gls")) return `https://gls-group.eu/PL/pl/sledzenie-paczek?match=${trackingNr}`;
    if (c.includes("poczt") || c.includes("pp") || c.includes("poczta")) return `https://emonitoring.poczta-polska.pl/?numer=${trackingNr}`;
    return `https://www.google.com/search?q=${encodeURIComponent(carrier + " tracking " + trackingNr)}`;
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  // API Call helper
  const handleAction = async (action: string, orderId: string, packageId?: string) => {
    const loadingId = packageId ? `${orderId}-${packageId}` : `${orderId}-${action}`;
    setLoadingActionId(loadingId);

    try {
      const res = await fetch("/api/client/orders/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, orderId, packageId }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      showToast(
        action === "confirmPackage"
          ? `Pomyślnie odebrano paczkę ${packageId}!`
          : action === "confirmOrder"
          ? "Odbiór zamówienia został potwierdzony!"
          : "Zamówienie zostało pomyślnie zrealizowane!"
      );

      // Refresh database data and sync selected modal order
      startTransition(() => {
        router.refresh();
        
        // Update selected order inside modal if open
        if (selectedOrder && selectedOrder.id === orderId) {
          // We can find the updated order in the next render, but for immediate UI sync:
          setSelectedOrder((prev) => {
            if (!prev) return null;
            
            let updatedStatus = prev.status;
            let updatedDeliveries = prev.deliveries;
            let updatedItems = prev.items;

            if (action === "confirmPackage") {
              updatedDeliveries = prev.deliveries.map((d) =>
                d.deliveryNr === packageId || d.id === packageId
                  ? { ...d, status: "DELIVERED" }
                  : d
              );

              // Update item counts
              const targetDel = prev.deliveries.find((d) => d.deliveryNr === packageId || d.id === packageId);
              if (targetDel) {
                updatedItems = prev.items.map((it) => {
                  const pkgItem = targetDel.items.find((pi) => pi.articleNr === it.articleNr);
                  if (pkgItem) {
                    const newDel = it.qtyDelivered + pkgItem.quantity;
                    const newSent = Math.max(0, it.qtySent - pkgItem.quantity);
                    return { ...it, qtyDelivered: newDel, qtySent: newSent };
                  }
                  return it;
                });
              }

              const totalQty = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
              const totalDel = updatedItems.reduce((sum, item) => sum + item.qtyDelivered, 0);
              updatedStatus = totalDel >= totalQty ? "DELIVERED" : "PARTIALLY_SENT";
            } else if (action === "confirmOrder") {
              updatedStatus = "DELIVERED";
              updatedDeliveries = prev.deliveries.map((d) => ({ ...d, status: "DELIVERED" }));
              updatedItems = prev.items.map((it) => ({
                ...it,
                qtyDelivered: it.quantity,
                qtySent: 0,
              }));
            } else if (action === "approveOrder") {
              updatedStatus = "APPROVED";
              updatedDeliveries = prev.deliveries.map((d) => ({ ...d, status: "DELIVERED" }));
              updatedItems = prev.items.map((it) => ({
                ...it,
                qtyDelivered: it.quantity,
                qtySent: 0,
              }));
            }

            return {
              ...prev,
              status: updatedStatus,
              deliveries: updatedDeliveries,
              items: updatedItems,
            };
          });
        }
      });
    } catch (err: any) {
      console.error(err);
      alert(`Błąd: ${err.message || "Coś poszło nie tak"}`);
    } finally {
      setLoadingActionId(null);
    }
  };

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
        <span style={{ marginLeft: "4px", color, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "3px" }}>
          {isZatwierdzone && <Check size={12} aria-hidden="true" />}{label}
        </span>
      </div>
    );
  };

  // Get localized status label for the modal meta grid
  const getStatusLabel = (orderStatus: OrderStatus) => {
    switch (orderStatus) {
      case "DRAFT": return "Szkic";
      case "APPROVED": return "Zrealizowane";
      case "IN_PROGRESS": return "W realizacji";
      case "PARTIALLY_SENT": return "Częściowo wysłane";
      case "SENT": return "Wysłane";
      case "DELIVERED": return "Dostarczone";
      case "CANCELLED": return "Anulowane";
      default: return orderStatus;
    }
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
      {/* Toast popup */}
      {toastMsg && (
        <div role="status" aria-live="polite" style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "var(--nav-bg)",
          color: "var(--nav-text)",
          padding: "12px 20px",
          borderRadius: "12px",
          zIndex: 99999,
          boxShadow: "var(--shadow-lg)",
          fontWeight: 600,
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}>
          <Check size={16} style={{ color: "var(--ok)" }} aria-hidden="true" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightbox && (
        <div 
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            cursor: "zoom-out",
            opacity: 1,
            transition: "opacity 0.25s ease"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <img 
              src={lightbox.src} 
              alt={lightbox.title} 
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: "16px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                objectFit: "contain"
              }}
            />
            <div style={{
              color: "#fff",
              fontSize: "16px",
              fontWeight: 600,
              background: "rgba(255, 255, 255, 0.08)",
              padding: "8px 18px",
              borderRadius: "99px",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              textAlign: "center"
            }}>
              {lightbox.title}
            </div>
            <button
              onClick={() => setLightbox(null)}
              aria-label="Zamknij podgląd"
              style={{
                position: "absolute",
                top: "-48px",
                right: "0",
                background: "rgba(255, 255, 255, 0.1)",
                border: 0,
                color: "#fff",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "grid",
                placeItems: "center",
                cursor: "pointer"
              }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Tracking Number Popup */}
      {trackingPopup && (
        <div
          onClick={() => setTrackingPopup(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.5)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99998,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracking-popup-title"
            style={{
              background: "var(--page-bg)",
              border: "1px solid var(--line)",
              borderRadius: "20px",
              padding: "28px 32px",
              width: "min(460px, 92vw)",
              boxShadow: "var(--shadow-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              animation: "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="row-10">
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "color-mix(in oklab, var(--accent) 12%, transparent)",
                  display: "grid",
                  placeItems: "center"
                }}>
                  <Truck size={20} style={{ color: "var(--accent)" }} aria-hidden="true" />
                </div>
                <div>
                  <div id="tracking-popup-title" style={{ fontWeight: 800, fontSize: "15px" }}>Śledzenie przesyłki</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>Paczka #{trackingPopup.deliveryNr}</div>
                </div>
              </div>
              <button
                onClick={() => setTrackingPopup(null)}
                aria-label="Zamknij"
                style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--muted)", padding: "4px" }}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Carrier badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 16px",
              background: "var(--section-bg)",
              borderRadius: "12px",
              border: "1px solid var(--line)"
            }}>
              <span style={{
                background: "#0f172a",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "6px",
                letterSpacing: "0.5px"
              }}>
                {trackingPopup.carrier.toUpperCase()}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Nr listu przewozowego</div>
                <div style={{
                  fontFamily: "monospace",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "1px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {trackingPopup.trackingNr}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a
                href={getCarrierUrl(trackingPopup.carrier, trackingPopup.trackingNr)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "44px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontSize: "14px"
                }}
              >
                <ExternalLink size={15} />
                Śledź przesyłkę na stronie kuriera
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(trackingPopup.trackingNr).then(() => {
                    showToast(`Skopiowano: ${trackingPopup.trackingNr}`);
                    setTrackingPopup(null);
                  });
                }}
                className="btn btn-secondary"
                style={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "44px",
                  borderRadius: "12px",
                  fontSize: "14px"
                }}
              >
                <Copy size={15} />
                Kopiuj numer przesyłki
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}

      <div className="table-wrapper" style={{ overflowX: "auto" }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "960px" }}>
          <thead>
            <tr style={{ background: "var(--section-bg)", borderBottom: "2px solid var(--line)" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>Numer</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>Data</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>Zakład / Dział</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", width: "30%" }}>Zawartość</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>ETA</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>Akcja</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const firstItem = order.items[0];
              const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
              const deliveredQty = order.items.reduce((sum, it) => sum + it.qtyDelivered, 0);
              const shippedQty = order.items.reduce((sum, it) => sum + it.qtySent, 0);

              // Build content node with status subtexts matching the demo
              const activeShipments = order.deliveries ? order.deliveries.filter(d => d.status === "IN_TRANSIT") : [];
              
              let contentsLabel: React.ReactNode = firstItem 
                ? `${order.items.length} poz: ${firstItem.productName}...`
                : "—";

              if (firstItem) {
                const isPartial = order.status === "PARTIALLY_SENT";
                const deliveredPct = totalQty > 0 ? Math.round((deliveredQty / totalQty) * 100) : 0;
                const inTransitPct = totalQty > 0 ? Math.round((shippedQty / totalQty) * 100) : 0;

                contentsLabel = (
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                    {/* Product name truncated */}
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {order.items.length > 1 ? `${order.items.length} poz.: ` : ""}{firstItem.productName}
                    </span>

                    {/* Partial progress: inline bar + counters */}
                    {isPartial && totalQty > 0 && (
                      <div className="row-6">
                        <div style={{ position: "relative", width: "80px", height: "5px", borderRadius: "99px", background: "var(--line)", flexShrink: 0, overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${deliveredPct}%`, background: "var(--ok)", borderRadius: "99px 0 0 99px" }} />
                          <div style={{ position: "absolute", left: `${deliveredPct}%`, top: 0, height: "100%", width: `${inTransitPct}%`, background: "#f59e0b" }} />
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {deliveredQty > 0 && <span style={{ color: "var(--ok)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px" }}><Check size={11} aria-hidden="true" />{deliveredQty}</span>}
                          {shippedQty > 0 && <span style={{ color: "#d97706", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px" }}><Truck size={11} aria-hidden="true" />{shippedQty}</span>}
                          {(totalQty - deliveredQty - shippedQty) > 0 && <span>{totalQty - deliveredQty - shippedQty} czeka</span>}
                        </span>
                      </div>
                    )}

                    {/* Non-partial delivery count */}
                    {!isPartial && (deliveredQty > 0 || (order.status === "SENT" && activeShipments.length > 0)) && (
                      <span style={{ fontSize: "11px", color: activeShipments.length > 0 ? "#d97706" : "var(--ok)", fontWeight: 600, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        {activeShipments.length > 0
                          ? <><Truck size={11} aria-hidden="true" /> {activeShipments[0].carrier.toUpperCase()} {activeShipments[0].trackingNr}</>
                          : <><Check size={11} aria-hidden="true" /> {deliveredQty}/{totalQty} szt.</>
                        }
                      </span>
                    )}
                  </div>
                );
              }


              const hasActiveShipments = activeShipments.length > 0;

              // Shorten branch name: strip client prefix if it repeats
              const branchShort = order.branch.name.replace(/^Kielce\s*[—-]\s*/i, "");
              const deptShort = order.department
                ? order.department.replace(/^Kielce\s*[—-]\s*/i, "").replace(branchShort, "").replace(/^\s*[—-]\s*/, "").trim()
                : null;

              return (
                <tr
                  key={order.id}
                  style={{ borderBottom: "1px solid var(--line)", transition: "background 0.2s ease", cursor: "pointer" }}
                  onClick={() => setSelectedOrder(order)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedOrder(order);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Otwórz szczegóły zamówienia ${order.orderNr}`}
                  className="clickable-row"
                >
                  {/* Numer zamówienia */}
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <div className="row-8">
                      <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "13px" }}>{order.orderNr}</span>
                      {order.orderType === "EXCHANGE" && (
                        <span className="badge" style={{ background: "#f3e8ff", color: "#6b21a8", fontSize: "10px", padding: "1px 6px" }}>WYMIANA</span>
                      )}
                      {order.orderType === "COMPLAINT" && (
                        <span className="badge" style={{ background: "#ffedd5", color: "#9a3412", fontSize: "10px", padding: "1px 6px" }}>REKLAMACJA</span>
                      )}
                    </div>
                  </td>
                  {/* Data */}
                  <td style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 500, fontSize: "13px", whiteSpace: "nowrap" }}>
                    {formatShortDate(order.createdAt)}
                  </td>
                  {/* Zakład / Dział */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                      <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{branchShort}</span>
                      {deptShort && <span style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{deptShort}</span>}
                    </div>
                  </td>
                  {/* Zawartość */}
                  <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: "13px" }}>
                    {contentsLabel}
                  </td>
                  {/* Status */}
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {getStatusTracker(order.status)}
                  </td>
                  {/* ETA */}
                  <td style={{ padding: "12px 16px", color: "var(--text)", fontWeight: 500, fontSize: "13px", whiteSpace: "nowrap" }}>
                    {formatShortDate(order.eta)}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                    {/* Row level actions */}
                    {order.status === "IN_PROGRESS" && (
                      <Link 
                        href={`/client/tickets/new?orderId=${order.id}&person=${firstItem ? encodeURIComponent(firstItem.employeeName || "") : ""}&item=${firstItem ? encodeURIComponent(firstItem.productName) : ""}`} 
                        className="btn btn-secondary" 
                        style={{ 
                          height: "28px", 
                          padding: "0 10px", 
                          fontSize: "12px", 
                          color: "#d97706", 
                          borderColor: "color-mix(in oklab, #d97706 35%, transparent)", 
                          display: "inline-flex", 
                          alignItems: "center" 
                        }}
                      >
                        Zgłoszenie
                      </Link>
                    )}

                    {order.status === "PARTIALLY_SENT" && (
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <Link 
                          href={`/client/tickets/new?orderId=${order.id}&person=${firstItem ? encodeURIComponent(firstItem.employeeName || "") : ""}&item=${firstItem ? encodeURIComponent(firstItem.productName) : ""}`} 
                          className="btn btn-secondary" 
                          style={{ 
                            height: "28px", 
                            padding: "0 10px", 
                            fontSize: "12px", 
                            color: "#d97706", 
                            borderColor: "color-mix(in oklab, #d97706 35%, transparent)", 
                            display: "inline-flex", 
                            alignItems: "center" 
                          }}
                        >
                          Zgłoszenie
                        </Link>
                        {hasActiveShipments && (
                          <button 
                            disabled={loadingActionId !== null}
                            onClick={() => {
                              if (confirm(`Czy na pewno chcesz potwierdzić odbiór paczek w drodze dla zamówienia ${order.orderNr}?`)) {
                                handleAction("confirmOrder", order.id);
                              }
                            }}
                            className="btn btn-secondary" 
                            style={{ 
                              height: "28px", 
                              padding: "0 10px", 
                              fontSize: "12px", 
                              color: "var(--ok)", 
                              borderColor: "color-mix(in oklab, var(--ok) 35%, transparent)" 
                            }}
                          >
                            {loadingActionId === `${order.id}-confirmOrder` ? "..." : "Odbiór"}
                          </button>
                        )}
                      </div>
                    )}

                    {order.status === "SENT" && (
                      <button 
                        disabled={loadingActionId !== null}
                        onClick={() => {
                          if (confirm(`Czy na pewno chcesz potwierdzić odbiór zamówienia ${order.orderNr}?`)) {
                            handleAction("confirmOrder", order.id);
                          }
                        }}
                        className="btn btn-secondary" 
                        style={{ 
                          height: "28px", 
                          padding: "0 10px", 
                          fontSize: "12px", 
                          color: "var(--ok)", 
                          borderColor: "color-mix(in oklab, var(--ok) 35%, transparent)" 
                        }}
                      >
                        {loadingActionId === `${order.id}-confirmOrder` ? "..." : "Potwierdź odbiór"}
                      </button>
                    )}

                    {order.status === "DELIVERED" && (
                      <button 
                        disabled={loadingActionId !== null}
                        onClick={() => {
                          if (confirm(`Czy na pewno chcesz zatwierdzić zamówienie ${order.orderNr} jako zrealizowane?`)) {
                            handleAction("approveOrder", order.id);
                          }
                        }}
                        className="btn btn-secondary" 
                        style={{ 
                          height: "28px", 
                          padding: "0 10px", 
                          fontSize: "12px", 
                          color: "var(--accent)", 
                          borderColor: "color-mix(in oklab, var(--accent) 35%, transparent)" 
                        }}
                      >
                        {loadingActionId === `${order.id}-approveOrder` ? "..." : "Zatwierdź"}
                      </button>
                    )}

                    {(order.status === "APPROVED" || order.status === "CANCELLED" || order.status === "DRAFT") && (
                      <span style={{ color: "var(--muted)", fontSize: "13px" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DIALOG DISPLAY */}
      {selectedOrder && (() => {
        const firstItem = selectedOrder.items[0];
        return (
          <div
            onClick={() => setSelectedOrder(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(2, 6, 23, 0.55)",
              backdropFilter: "blur(4px)",
              display: "grid",
              placeItems: "center",
              zIndex: 1000
            }}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="client-order-modal-title"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(1080px, 96vw)",
                background: "var(--page-bg)",
                border: "1px solid var(--line)",
                borderRadius: "24px",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
              animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}
          >
            {/* Header */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="row-10">
                <h3 id="client-order-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>Szczegóły zamówienia {selectedOrder.orderNr}</h3>
                {selectedOrder.orderType === "EXCHANGE" && (
                  <span className="badge" style={{ background: "#f3e8ff", color: "#6b21a8", fontSize: "11px", padding: "2px 8px" }}>WYMIANA</span>
                )}
                {selectedOrder.orderType === "COMPLAINT" && (
                  <span className="badge" style={{ background: "#ffedd5", color: "#9a3412", fontSize: "11px", padding: "2px 8px" }}>REKLAMACJA</span>
                )}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "var(--section-bg)", borderRadius: "16px", border: "1px solid var(--line)" }}>
                {[
                  { step: 1, label: "PRZYJĘTE" },
                  { step: 2, label: "W DRODZE" },
                  { step: 3, label: "ODEBRANE" },
                  { step: 4, label: "ZREALIZOWANE" }
                ].map((s, idx, arr) => {
                  const activeStep = getActiveStep(selectedOrder.status);
                  const isActive = activeStep >= s.step;
                  
                  return (
                    <React.Fragment key={s.step}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1, textAlign: "center" }}>
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
                          transition: "all 0.3s ease",
                        }}>
                          {s.step}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: isActive ? "var(--text)" : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {s.label}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ height: "2px", background: activeStep > s.step ? "var(--accent)" : "var(--line)", flex: 1, maxWidth: "12%" }}></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Dynamic Status Banners matching the HTML prototype exactly */}
              {selectedOrder.status === "IN_PROGRESS" && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 20px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e40af",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: "1.4"
                }}>
                  <Clock size={18} style={{ color: "#3b82f6", flexShrink: 0 }} />
                  <span>Zamówienie zostało zaakceptowane. Trwa kompletowanie odzieży w magazynie SUPON.</span>
                </div>
              )}

              {selectedOrder.status === "SENT" && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 20px",
                  borderRadius: "12px",
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  color: "#b45309",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: "1.4"
                }}>
                  <Package size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                  <span>Zamówienie zostało wysłane. Oczekuje na dostarczenie przesyłki kurierskiej.</span>
                </div>
              )}

              {selectedOrder.status === "PARTIALLY_SENT" && (
                (() => {
                  const hasActiveShip = selectedOrder.deliveries?.some(d => d.status === "IN_TRANSIT");
                  if (hasActiveShip) {
                    return (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 20px",
                        borderRadius: "12px",
                        background: "#fffbeb",
                        border: "1px solid #fef3c7",
                        color: "#b45309",
                        fontSize: "13px",
                        fontWeight: 600,
                        lineHeight: "1.4"
                      }}>
                        <Package size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                        <span>Odebrano część towaru. Kolejna przesyłka jest w drodze – potwierdź odbiór paczki po dostarczeniu.</span>
                      </div>
                    );
                  } else {
                    return (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 20px",
                        borderRadius: "12px",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        color: "#1e40af",
                        fontSize: "13px",
                        fontWeight: 600,
                        lineHeight: "1.4"
                      }}>
                        <Clock size={18} style={{ color: "#3b82f6", flexShrink: 0 }} />
                        <span>Odebrano część towaru. Oczekiwanie na wysyłkę pozostałych pozycji z magazynu.</span>
                      </div>
                    );
                  }
                })()
              )}

              {selectedOrder.status === "DELIVERED" && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 20px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: "1.4"
                }}>
                  <ShieldCheck size={18} style={{ color: "var(--ok)", flexShrink: 0 }} />
                  <span>Wszystkie pozycje zamówienia zostały dostarczone. Sprawdź ich zgodność i zatwierdź odbiór.</span>
                </div>
              )}

              {selectedOrder.status === "APPROVED" && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 20px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: "1.4"
                }}>
                  <ShieldCheck size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <span>Zamówienie zostało zrealizowane. Zakończono proces obsługi.</span>
                </div>
              )}

              {/* Details grid info */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", background: "var(--section-bg)", padding: "16px", borderRadius: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Status</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "4px" }}>{getStatusLabel(selectedOrder.status)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Data</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "4px" }}>{formatShortDate(selectedOrder.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Dostawa</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "4px" }}>{selectedOrder.branch.name}{selectedOrder.department ? ` — ${selectedOrder.department}` : ""}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>ETA</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "4px" }}>{formatShortDate(selectedOrder.eta)}</div>
                </div>
              </div>

              {/* Table of items */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontWeight: 700 }}>Szczegóły zamówienia</h4>
                <div style={{ overflowX: "auto" }}>
                  <table className="table" style={{ width: "100%", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "var(--section-bg)" }}>
                        <th style={{ padding: "10px 8px", fontSize: "11px", whiteSpace: "nowrap" }}>Foto</th>
                        <th style={{ padding: "10px 8px", fontSize: "11px", whiteSpace: "nowrap" }}>Produkt</th>
                        <th style={{ padding: "10px 8px", fontSize: "11px", whiteSpace: "nowrap" }}>Nr artykułu</th>
                        <th style={{ padding: "10px 8px", fontSize: "11px", whiteSpace: "nowrap" }}>Rozmiar</th>
                        <th style={{ padding: "10px 8px", fontSize: "11px", whiteSpace: "nowrap" }}>Zamówiono</th>
                        <th style={{ padding: "10px 8px", fontSize: "11px", whiteSpace: "nowrap" }}>Dostarczono</th>
                        <th style={{ padding: "10px 8px", fontSize: "11px", whiteSpace: "nowrap" }}>W drodze</th>
                        <th style={{ padding: "10px 8px", fontSize: "11px", whiteSpace: "nowrap" }}>Status</th>
                        <th style={{ padding: "10px 8px", fontSize: "11px", whiteSpace: "nowrap" }}>Przeznaczone dla</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => {
                        let itemStatus = item.status || getStatusLabel(selectedOrder.status);
                        
                        let badgeStyle: React.CSSProperties = {
                          fontSize: "10px",
                          padding: "3px 6px",
                          borderRadius: "6px",
                          fontWeight: 700,
                          textTransform: "uppercase"
                        };

                        if (itemStatus === "Dostarczone" || itemStatus === "Zrealizowane" || selectedOrder.status === "DELIVERED" || selectedOrder.status === "APPROVED") {
                          badgeStyle.background = "color-mix(in oklab, var(--ok) 15%, transparent)";
                          badgeStyle.color = "var(--ok)";
                        } else if (itemStatus === "W drodze" || itemStatus === "Wysłane") {
                          badgeStyle.background = "color-mix(in oklab, var(--accent) 15%, transparent)";
                          badgeStyle.color = "var(--accent)";
                        } else if (itemStatus === "Częściowo wysłane") {
                          badgeStyle.background = "color-mix(in oklab, #b45309 15%, transparent)";
                          badgeStyle.color = "#b45309";
                        } else {
                          badgeStyle.background = "var(--line)";
                          badgeStyle.color = "var(--muted)";
                        }

                        return (
                          <tr key={item.id}>
                            <td style={{ padding: "8px" }}>
                              <img 
                                onClick={() => setLightbox({ src: item.product.photoUrls?.[0] || "/placeholder-product.png", title: item.productName })}
                                src={item.product.photoUrls?.[0] || "/placeholder-product.png"} 
                                alt="Produkt" 
                                style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", cursor: "zoom-in" }} 
                              />
                            </td>
                            <td style={{ padding: "8px", fontWeight: 600 }}>{item.productName}</td>
                            <td style={{ padding: "8px", fontFamily: "monospace" }}>{item.articleNr}</td>
                            <td style={{ padding: "8px" }}>{item.size}</td>
                            <td style={{ padding: "8px" }}>{item.quantity} szt.</td>
                            <td style={{ padding: "8px" }}>{item.qtyDelivered} szt.</td>
                            <td style={{ padding: "8px" }}>{item.qtySent} szt.</td>
                            <td style={{ padding: "8px" }}>
                              <span style={badgeStyle}>
                                {itemStatus === "Zatwierdzone" ? "Dostarczone" : itemStatus.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: "8px" }}>{item.employeeName || "Zamówienie zbiorcze"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Packages and Deliveries List */}
              {selectedOrder.deliveries?.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 12px 0", fontWeight: 700 }}>Wykaz dostaw (paczki)</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                    {selectedOrder.deliveries.map((del) => {
                      const isPending = del.status === "IN_TRANSIT";
                      const statusColor = isPending 
                        ? "background: rgba(245, 158, 11, 0.15); color: #b45309;" 
                        : "background: color-mix(in oklab, var(--ok) 15%, transparent); color: var(--ok);";

                      const handleConfirmPackage = () => {
                        if (confirm(`Czy na pewno chcesz potwierdzić odbiór paczki ${del.deliveryNr}?`)) {
                          handleAction("confirmPackage", selectedOrder.id, del.deliveryNr);
                        }
                      };

                      return (
                        <div key={del.id} style={{ border: "1px solid var(--line)", borderRadius: "16px", padding: "20px", background: "var(--page-bg)", display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ background: "#000", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>{del.carrier.toUpperCase()}</span>
                              Paczka #{del.deliveryNr}
                            </span>
                            <span className="badge" style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "8px", fontWeight: 700, ...Object.fromEntries(statusColor.split(";").filter(Boolean).map(s => {
                              const [k, v] = s.split(":");
                              return [k.trim(), v.trim()];
                            })) }}>
                              {del.status === "DELIVERED" ? "Dostarczona" : "W drodze"}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "var(--muted)" }}>Data nadania:</span>
                              <strong style={{ color: "var(--text)" }}>{formatShortDate(del.shippedAt)}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "var(--muted)" }}>List przewozowy:</span>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setTrackingPopup({ carrier: del.carrier, trackingNr: del.trackingNr, deliveryNr: del.deliveryNr });
                                }}
                                style={{
                                  color: "var(--accent)",
                                  fontWeight: 700,
                                  textDecoration: "underline",
                                  textDecorationStyle: "dashed",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                {del.trackingNr}
                                <ExternalLink size={11} />
                              </a>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "var(--muted)" }}>Zawartość:</span>
                              <strong style={{ color: "var(--text)" }}>
                                {del.items.map((i) => `${i.productName} (${i.quantity} szt.)`).join(", ")}
                              </strong>
                            </div>
                          </div>

                          {isPending && (
                            <button 
                              disabled={loadingActionId !== null}
                              onClick={handleConfirmPackage}
                              className="btn btn-primary btn-sm" 
                              style={{ width: "100%", height: "36px", marginTop: "4px", gap: "4px", background: "var(--accent)", border: "1px solid var(--accent)", color: "#fff", fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center" }}
                            >
                              <ShieldCheck size={14} /> {loadingActionId === `${selectedOrder.id}-${del.deliveryNr}` ? "Aktualizacja..." : "Potwierdź odbiór paczki"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Actions footer matching the HTML prototype exactly based on status */}
            <div style={{ padding: "20px 32px 32px", borderTop: "none", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              {(selectedOrder.status === "IN_PROGRESS" || selectedOrder.status === "PARTIALLY_SENT") && (
                <>
                  <Link 
                    href={`/client/tickets/new?orderId=${selectedOrder.id}&person=${firstItem ? encodeURIComponent(firstItem.employeeName || "") : ""}&item=${firstItem ? encodeURIComponent(firstItem.productName) : ""}`}
                    className="btn" 
                    style={{ background: "#d97706", borderColor: "#d97706", color: "#fff", fontWeight: 700, padding: "10px 18px", fontSize: "13px" }}
                  >
                    Utwórz zgłoszenie
                  </Link>
                  <Link 
                    href={`/api/client/reports/pdf?orderId=${selectedOrder.id}`}
                    className="btn btn-secondary" 
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    Pobierz WZ (PDF)
                  </Link>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="btn btn-secondary" 
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    Zamknij
                  </button>
                </>
              )}

              {selectedOrder.status === "SENT" && (
                <>
                  <button 
                    disabled={loadingActionId !== null}
                    onClick={() => {
                      if (confirm(`Czy na pewno chcesz potwierdzić odbiór całości zamówienia ${selectedOrder.orderNr}?`)) {
                        handleAction("confirmOrder", selectedOrder.id);
                      }
                    }}
                    className="btn" 
                    style={{ background: "var(--ok)", borderColor: "var(--ok)", color: "#fff", fontWeight: 700, padding: "10px 18px", fontSize: "13px" }}
                  >
                    {loadingActionId === `${selectedOrder.id}-confirmOrder` ? "Aktualizacja..." : "Potwierdź odbiór całości"}
                  </button>
                  <Link 
                    href={`/api/client/reports/pdf?orderId=${selectedOrder.id}`}
                    className="btn btn-secondary" 
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    Pobierz WZ (PDF)
                  </Link>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="btn btn-secondary" 
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    Zamknij
                  </button>
                </>
              )}

              {selectedOrder.status === "DELIVERED" && (
                <>
                  <button 
                    disabled={loadingActionId !== null}
                    onClick={() => {
                      if (confirm(`Czy na pewno chcesz zatwierdzić zamówienie ${selectedOrder.orderNr} jako zrealizowane?`)) {
                        handleAction("approveOrder", selectedOrder.id);
                      }
                    }}
                    className="btn" 
                    style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "#fff", fontWeight: 700, padding: "10px 18px", fontSize: "13px" }}
                  >
                    {loadingActionId === `${selectedOrder.id}-approveOrder` ? "Aktualizacja..." : "Zatwierdź jako zrealizowane"}
                  </button>
                  <Link 
                    href={`/api/client/reports/pdf?orderId=${selectedOrder.id}`}
                    className="btn btn-secondary" 
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    Pobierz WZ (PDF)
                  </Link>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="btn btn-secondary" 
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    Zamknij
                  </button>
                </>
              )}

              {(selectedOrder.status === "APPROVED" || selectedOrder.status === "CANCELLED" || selectedOrder.status === "DRAFT") && (
                <>
                  <button 
                    onClick={() => showToast("Zamówienie zostało skopiowane (demo)")}
                    className="btn btn-secondary" 
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    Powtórz zamówienie
                  </button>
                  <Link 
                    href={`/api/client/reports/pdf?orderId=${selectedOrder.id}`}
                    className="btn btn-secondary" 
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    Pobierz WZ (PDF)
                  </Link>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="btn" 
                    style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "#fff", padding: "10px 18px", fontSize: "13px" }}
                  >
                    Zamknij
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
        );
      })()}
    </>
  );
}
