"use client";

import React, { useState, useTransition } from "react";
import { OrderStatus, OrderType } from "@prisma/client";
import { generateWz, uploadWzPdf, forceMarkAsDelivered, forceApproveOrder } from "./actions";
import { FileText, Settings, Loader2, Upload, CheckCircle } from "lucide-react";

interface OrderItemInput {
  id: string;
  articleNr: string;
  productName: string;
  size: string;
  quantity: number;
  qtyDelivered: number;
}

interface OrderActionsProps {
  orderId: string;
  currentStatus: OrderStatus;
  items: OrderItemInput[];
  recipientDefault: string;
  orderType: OrderType;
}

export default function OrderActions({
  orderId,
  currentStatus,
  items,
  recipientDefault,
  orderType,
}: OrderActionsProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isUpdatingStatus, startUpdateStatus] = useTransition();
  const [isWzModalOpen, setIsWzModalOpen] = useState(false);
  const [isGeneratingWz, startGenerateWz] = useTransition();

  // WZ Modal Form Fields
  const [recipient, setRecipient] = useState(recipientDefault);
  const [carrier, setCarrier] = useState("DPD");
  const [trackingNr, setTrackingNr] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Track quantities to ship
  const initialShipQtys = items.reduce((acc, item) => {
    acc[item.id] = 0;
    return acc;
  }, {} as Record<string, number>);
  const [shipQtys, setShipQtys] = useState<Record<string, number>>(initialShipQtys);

  const [wzError, setWzError] = useState("");

  const handleMarkAsDelivered = async () => {
    if (!confirm("Czy na pewno chcesz oznaczyć to zamówienie jako dostarczone? Spowoduje to również zatwierdzenie wszystkich powiązanych dostaw.")) {
      return;
    }
    startUpdateStatus(async () => {
      const res = await forceMarkAsDelivered(orderId);
      if (res.success) {
        setStatus("DELIVERED");
      } else {
        alert(res.error || "Wystąpił błąd");
      }
    });
  };

  const handleApproveOrder = async () => {
    if (!confirm("Czy na pewno chcesz zatwierdzić (zamknąć) to zamówienie? Ta operacja sfinalizuje całe zamówienie.")) {
      return;
    }
    startUpdateStatus(async () => {
      const res = await forceApproveOrder(orderId);
      if (res.success) {
        setStatus("APPROVED");
      } else {
        alert(res.error || "Wystąpił błąd");
      }
    });
  };

  const handleQtyChange = (itemId: string, val: number, max: number) => {
    const num = isNaN(val) ? 0 : val;
    const finalVal = Math.max(0, Math.min(max, num));
    setShipQtys(prev => ({ ...prev, [itemId]: finalVal }));
  };

  const handleSubmitWz = (e: React.FormEvent) => {
    e.preventDefault();
    setWzError("");

    const shipItems = Object.entries(shipQtys).map(([orderItemId, quantity]) => ({
      orderItemId,
      quantity,
    })).filter(i => i.quantity > 0);

    if (shipItems.length === 0) {
      setWzError("Wybierz co najmniej jeden produkt do wysłania.");
      return;
    }

    if (!selectedFile && orderType === "STANDARD") {
      setWzError("Załączenie pliku PDF WZ jest wymagane.");
      return;
    }

    startGenerateWz(async () => {
      let pdfUrl: string | undefined = undefined;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await uploadWzPdf(formData);
        if (!uploadRes.success) {
          setWzError(uploadRes.error || "Błąd przy przesyłaniu pliku PDF.");
          return;
        }
        pdfUrl = uploadRes.pdfUrl;
      }

      const res = await generateWz(orderId, carrier, trackingNr, recipient, shipItems, pdfUrl);
      if (res.success) {
        setIsWzModalOpen(false);
        // Reset quantities
        setShipQtys({});
        setSelectedFile(null);
        alert(`Dokument ${res.wzNr} został wygenerowany pomyślnie!`);
      } else {
        setWzError(res.error || "Wystąpił błąd");
      }
    });
  };

  const pendingItemsToShip = items.some(item => item.quantity - item.qtyDelivered > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Status Controller Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={18} style={{ color: "var(--accent)" }} /> Akcje menedżera
          </h3>
        </div>
        
        <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(status === "SENT" || status === "PARTIALLY_SENT") && (
            <div>
              <button
                onClick={handleMarkAsDelivered}
                disabled={isUpdatingStatus}
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", height: "40px", borderColor: "var(--ok)", color: "var(--ok)", background: "rgba(22, 163, 74, 0.05)" }}
              >
                {isUpdatingStatus ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={16} /> Oznacz jako dostarczone
                  </>
                )}
              </button>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px", textAlign: "center" }}>
                Użyj tego przycisku, jeśli klient nie potwierdził odbioru paczki samodzielnie.
              </p>
            </div>
          )}

          {status === "DELIVERED" && (
            <div>
              <button
                onClick={handleApproveOrder}
                disabled={isUpdatingStatus}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", height: "40px" }}
              >
                {isUpdatingStatus ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={16} /> Zatwierdź zamówienie
                  </>
                )}
              </button>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px", textAlign: "center" }}>
                Zatwierdź i sfinalizuj (zamknij) zamówienie, jeśli klient tego nie zrobił.
              </p>
            </div>
          )}

          {pendingItemsToShip ? (
            <button
              onClick={() => setIsWzModalOpen(true)}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", height: "40px" }}
            >
              <Upload size={16} /> Wgraj dokument WZ
            </button>
          ) : (
            status !== "DELIVERED" && status !== "APPROVED" && (
              <div style={{ textAlign: "center", padding: "12px", border: "1px dashed var(--line)", borderRadius: "8px", background: "var(--section-bg)", fontSize: "12.5px", color: "var(--muted)" }}>
                Wszystkie pozycje zostały już wysłane.
              </div>
            )
          )}
        </div>
      </div>

      {/* WZ Modal */}
      {isWzModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "grid",
          placeItems: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div className="card animate-scale" style={{ width: "100%", maxWidth: "680px", background: "var(--page-bg)", padding: 0, display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}>
            
            <div className="card-header" style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Dodanie dokumentu WZ i wysyłka</h3>
              <button 
                onClick={() => setIsWzModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--muted)" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitWz} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "calc(90vh - 140px)" }}>
                {wzError && (
                  <div style={{ background: "var(--accent-light)", color: "var(--err)", border: "1px solid var(--err)", padding: "12px", borderRadius: "8px", fontSize: "13.5px" }}>
                    {wzError}
                  </div>
                )}

                {/* Delivery details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
                      Odbiorca paczki
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
                      Kurier / Przewoźnik
                    </label>
                    <select
                      className="form-select"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                    >
                      <option value="DPD">DPD</option>
                      <option value="InPost">InPost Kurier</option>
                      <option value="Osobisty">Odbiór osobisty</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
                    Numer śledzenia przesyłki
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={trackingNr}
                    onChange={(e) => setTrackingNr(e.target.value)}
                    placeholder="Wpisz numer nadania paczki..."
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Upload size={13} /> Załącz plik PDF WZ {orderType === "STANDARD" ? "(Wymagane)" : "(Opcjonalne)"}
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="form-input"
                    style={{ paddingTop: "8px" }}
                    required={orderType === "STANDARD"}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      } else {
                        setSelectedFile(null);
                      }
                    }}
                  />
                </div>

                {/* Shipped items table */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
                    Wybierz ilości do wysyłki
                  </label>
                  <div className="table-wrapper" style={{ border: "1px solid var(--line)", maxHeight: "240px", overflowY: "auto" }}>
                    <table className="table" style={{ fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th>Produkt</th>
                          <th>Rozmiar</th>
                          <th style={{ textAlign: "center" }}>Do wysłania</th>
                          <th style={{ width: "110px", textAlign: "center" }}>Ilość w WZ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const maxToShip = item.quantity - item.qtyDelivered;
                          if (maxToShip <= 0) return null;
                          return (
                            <tr key={item.id}>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <strong style={{ color: "var(--text)" }}>{item.productName}</strong>
                                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>{item.articleNr}</span>
                                </div>
                              </td>
                              <td>{item.size}</td>
                              <td style={{ textAlign: "center" }}>{maxToShip} szt.</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-input"
                                  style={{ height: "32px", width: "80px", margin: "0 auto", textAlign: "center", padding: "0" }}
                                  min={0}
                                  max={maxToShip}
                                  value={shipQtys[item.id] ?? 0}
                                  onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value, 10), maxToShip)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Form actions */}
              <div style={{ padding: "16px 24px", background: "var(--section-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={() => setIsWzModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ height: "36px" }}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingWz}
                  className="btn btn-primary"
                  style={{ height: "36px" }}
                >
                  {isGeneratingWz ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Wgrywanie...
                    </>
                  ) : (
                    "Wgraj WZ i wyślij"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
