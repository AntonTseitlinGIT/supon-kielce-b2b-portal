"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createTicket } from "./actions";
import { TicketType } from "@prisma/client";
import { AlertTriangle, ShieldCheck, Paperclip, Loader2, Send, Building2, HelpCircle, ShoppingBag, User, Package, MessageSquare, PlusCircle } from "lucide-react";

interface BranchOption {
  id: string;
  name: string;
}

interface OrderOption {
  id: string;
  orderNr: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    articleNr: string;
    size: string;
    product: {
      availableSizes: string[];
    };
  }[];
}

interface EmployeeOption {
  id: string;
  name: string;
  branchId: string;
}

interface NewTicketFormProps {
  branches: BranchOption[];
  orders: OrderOption[];
  employees: EmployeeOption[];
  userRole: string;
  defaultBranchId?: string;
}

export default function NewTicketForm({
  branches,
  orders,
  employees,
  userRole,
  defaultBranchId,
}: NewTicketFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [branchId, setBranchId] = useState(defaultBranchId || branches[0]?.id || "");
  const [type, setType] = useState<TicketType>("COMPLAINT");
  
  // Linkage toggle states
  const [linkOrder, setLinkOrder] = useState(false);
  const [linkProduct, setLinkProduct] = useState(false);
  const [linkEmployee, setLinkEmployee] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [selectedOrderItemId, setSelectedOrderItemId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [productId, setProductId] = useState("");
  const [size, setSize] = useState("");
  const [newSize, setNewSize] = useState("");
  const [itemName, setItemName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");

  // Helper states
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Automatically enforce order/product linkage for Complaint or Exchange types
  useEffect(() => {
    if (type === "COMPLAINT" || type === "EXCHANGE") {
      setLinkOrder(true);
      setLinkProduct(true);
    } else {
      setLinkOrder(false);
      setLinkProduct(false);
    }
    // Reset selections on type change
    setOrderId("");
    setSelectedOrderItemId("");
    setProductId("");
    setSize("");
    setNewSize("");
    setItemName("");
  }, [type]);

  // Reset employee selection if branch changes
  useEffect(() => {
    setEmployeeId("");
    setEmployeeName("");
    setOrderId("");
    setSelectedOrderItemId("");
    setProductId("");
    setSize("");
    setNewSize("");
    setItemName("");
  }, [branchId]);

  const isDirty =
    branchId !== (defaultBranchId || branches[0]?.id || "") ||
    type !== "COMPLAINT" ||
    linkOrder ||
    linkProduct ||
    linkEmployee ||
    orderId !== "" ||
    employeeId !== "" ||
    messageText !== "" ||
    fileUrl !== "";

  const shouldWarn = isDirty && !isPending && !successMsg;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldWarn) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    const handleAnchorClick = (e: MouseEvent) => {
      if (!shouldWarn) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          const confirmLeave = window.confirm(
            "Masz niezapisane zmiany. Czy na pewno chcesz opuścić tę stronę?"
          );
          if (!confirmLeave) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [shouldWarn]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const nameOnly = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "");
      const newFileName = `${Date.now()}-${nameOnly}.${fileExt}`;
      const filePath = `tickets/${newFileName}`;

      const { data, error } = await supabase.storage
        .from("ticket-attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("ticket-attachments")
        .getPublicUrl(filePath);

      setFileUrl(publicUrl);
      setFileName(file.name);
      setSuccessMsg("Plik został pomyślnie załączony.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Error uploading ticket attachment:", error);
      setErrorMsg("Błąd podczas załączania pliku. Możesz wysłać zgłoszenie bez załącznika.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!branchId) {
      setErrorMsg("Oddział jest wymagany.");
      return;
    }
    if (type === "COMPLAINT" && !productId) {
      setErrorMsg("Reklamacja musi dotyczyć konkretnego towaru/produktu.");
      return;
    }
    if (type === "EXCHANGE" && (!productId || !newSize)) {
      setErrorMsg("Wymiana wymaga wybrania towaru oraz określenia nowego rozmiaru.");
      return;
    }
    if (!messageText.trim()) {
      setErrorMsg("Opisz treść zgłoszenia.");
      return;
    }

    startTransition(async () => {
      const res = await createTicket({
        type,
        branchId,
        orderId: orderId || undefined,
        employeeName: employeeName || undefined,
        employeeId: employeeId || undefined,
        itemName: itemName || undefined,
        productId: productId || undefined,
        size: size || undefined,
        newSize: newSize || undefined,
        messageText,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
      });

      if (res.success) {
        setSuccessMsg(`Zgłoszenie ${res.ticketNr} zostało utworzone! Trwa przekierowanie do chatu...`);
        setTimeout(() => {
          router.push(`/client/tickets/${res.ticketId}`);
        }, 1500);
      } else {
        setErrorMsg(res.error || "Błąd podczas zapisywania zgłoszenia.");
      }
    });
  };

  const filteredEmployees = employees.filter((emp) => emp.branchId === branchId);
  const filteredOrders = orders.filter((o) => o.items.length > 0);

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Alert states */}
      {errorMsg && (
        <div className="badge badge-danger" style={{ padding: "12px 18px", borderRadius: "var(--radius)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="badge badge-success" style={{ padding: "12px 18px", borderRadius: "var(--radius)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Main Details Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", border: "1px solid var(--line)", padding: "24px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "14px", marginBottom: "4px" }}>
            <div style={{ background: "var(--accent-light)", color: "var(--accent)", width: "40px", height: "40px", borderRadius: "12px", display: "grid", placeItems: "center" }}>
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Dane zgłoszenia</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>Określ cel zgłoszenia oraz oddział, którego ono dotyczy</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Oddział selection */}
            {userRole === "CLIENT_HEAD" ? (
              <div className="form-group">
                <label className="form-label form-required" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building2 size={14} style={{ color: "var(--muted)" }} /> Oddział
                </label>
                <select
                  className="form-select"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={isPending}
                >
                  <option value="">Wybierz oddział...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building2 size={14} style={{ color: "var(--muted)" }} /> Oddział
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={branches.find((b) => b.id === branchId)?.name || ""}
                  disabled
                />
              </div>
            )}

            {/* Ticket Type */}
            <div className="form-group">
              <label className="form-label form-required" style={{ display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", fontSize: "11px", fontWeight: 800, color: "var(--muted)" }}>
                Typ zgłoszenia
              </label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as TicketType)}
                disabled={isPending}
                style={{ height: "42px" }}
              >
                <option value="COMPLAINT">Reklamacja</option>
                <option value="EXCHANGE">Wymiana</option>
                <option value="GENERAL">Ogólne zapytanie / Inne</option>
              </select>
            </div>
          </div>
        </div>

        {/* Linkage Toggles Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", border: "1px solid var(--line)", padding: "24px", background: "var(--section-bg)" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>
            Powiązanie zgłoszenia
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="switch-container" style={{ margin: 0, background: "var(--page-bg)", opacity: (type === "COMPLAINT" || type === "EXCHANGE") ? 0.7 : 1 }}>
              <span className="switch-label">Powiąż z konkretnym zamówieniem {(type === "COMPLAINT" || type === "EXCHANGE") && " (Wymagane)"}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={linkOrder}
                  onChange={(e) => {
                    if (type === "COMPLAINT" || type === "EXCHANGE") return; // Enforced
                    const checked = e.target.checked;
                    setLinkOrder(checked);
                    if (!checked) {
                      setOrderId("");
                      setLinkProduct(false);
                      setProductId("");
                      setSize("");
                      setNewSize("");
                      setItemName("");
                    }
                  }}
                  disabled={isPending || type === "COMPLAINT" || type === "EXCHANGE"}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="switch-container" style={{ margin: 0, background: "var(--page-bg)", opacity: (type === "COMPLAINT" || type === "EXCHANGE") ? 0.7 : 1 }}>
              <span className="switch-label">Powiąż z konkretnym produktem {(type === "COMPLAINT" || type === "EXCHANGE") && " (Wymagane)"}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={linkProduct}
                  onChange={(e) => {
                    if (type === "COMPLAINT" || type === "EXCHANGE") return; // Enforced
                    const checked = e.target.checked;
                    setLinkProduct(checked);
                    if (checked) {
                      setLinkOrder(true);
                    } else {
                      setProductId("");
                      setSize("");
                      setNewSize("");
                      setItemName("");
                    }
                  }}
                  disabled={isPending || type === "COMPLAINT" || type === "EXCHANGE"}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="switch-container" style={{ margin: 0, background: "var(--page-bg)" }}>
              <span className="switch-label">Powiąż z konkretnym pracownikiem</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={linkEmployee}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setLinkEmployee(checked);
                    if (!checked) {
                      setEmployeeId("");
                      setEmployeeName("");
                    }
                  }}
                  disabled={isPending}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Conditional Dynamic Linkage Fields Card */}
        {(linkOrder || linkProduct || linkEmployee) && (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", border: "1px solid var(--line)", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "14px", marginBottom: "4px" }}>
              <div style={{ background: "var(--accent-light)", color: "var(--accent)", width: "40px", height: "40px", borderRadius: "12px", display: "grid", placeItems: "center" }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Szczegóły powiązania</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>Wprowadź dane zamówienia, produktu lub pracownika</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(linkOrder || linkProduct) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {linkOrder && (
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Powiązane zamówienie</label>
                      <select
                        className="form-select"
                        value={orderId}
                        onChange={(e) => {
                          setOrderId(e.target.value);
                          setSelectedOrderItemId("");
                          setProductId("");
                          setSize("");
                          setNewSize("");
                          setItemName("");
                        }}
                        disabled={isPending}
                        style={{ height: "42px" }}
                      >
                        <option value="">-- Wybierz zamówienie --</option>
                        {filteredOrders.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.orderNr}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {linkProduct && (
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Wybierz produkt z zamówienia</label>
                      <select
                        className="form-select"
                        value={selectedOrderItemId}
                        onChange={(e) => {
                          const orderItemId = e.target.value;
                          setSelectedOrderItemId(orderItemId);
                          const order = orders.find((o) => o.id === orderId);
                          const item = order?.items.find((i) => i.id === orderItemId);
                          if (item) {
                            setItemName(`${item.productName} (${item.articleNr})`);
                            setProductId(item.productId);
                            setSize(item.size);
                            setNewSize("");
                          } else {
                            setItemName("");
                            setProductId("");
                            setSize("");
                            setNewSize("");
                          }
                        }}
                        disabled={isPending || !orderId}
                        style={{ height: "42px" }}
                      >
                        <option value="">-- Wybierz produkt --</option>
                        {orderId ? (
                          orders
                            .find((o) => o.id === orderId)
                            ?.items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.productName} ({item.articleNr}) - Rozmiar: {item.size}
                              </option>
                            ))
                        ) : (
                          <option disabled value="">
                            -- Wybierz najpierw zamówienie --
                          </option>
                        )}
                      </select>
                    </div>
                  )}

                  {type === "EXCHANGE" && productId && (
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Nowy rozmiar na wymianę</label>
                      <select
                        className="form-select"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        disabled={isPending}
                        style={{ height: "42px", maxWidth: "50%" }}
                      >
                        <option value="">-- Wybierz nowy rozmiar --</option>
                        {orders
                          .find((o) => o.id === orderId)
                          ?.items.find((i) => i.id === selectedOrderItemId)
                          ?.product.availableSizes.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz} (Obecny rozmiar: {size})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {linkEmployee && (
                <div className="form-group" style={{ maxWidth: "50%" }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Pracownik</label>
                  {filteredEmployees.length > 0 ? (
                    <select
                      className="form-select"
                      value={employeeId}
                      onChange={(e) => {
                        const empId = e.target.value;
                        setEmployeeId(empId);
                        const emp = employees.find((emp) => emp.id === empId);
                        setEmployeeName(emp ? emp.name : "");
                      }}
                      disabled={isPending}
                      style={{ height: "42px" }}
                    >
                      <option value="">-- Wybierz pracownika --</option>
                      {filteredEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Imię i Nazwisko"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      disabled={isPending}
                      style={{ height: "42px" }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message and Attachment Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", border: "1px solid var(--line)", padding: "24px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "14px", marginBottom: "4px" }}>
            <div style={{ background: "var(--accent-light)", color: "var(--accent)", width: "40px", height: "40px", borderRadius: "12px", display: "grid", placeItems: "center" }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Opis problemu (Rozpocznij konwersację)</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>Opisz dokładnie swój problem lub pytanie. Menedżer odpowie na czacie...</p>
            </div>
          </div>

          {/* Description message */}
          <div className="form-group">
            <textarea
              className="form-textarea"
              rows={6}
              placeholder="Opisz dokładnie swój problem lub pytanie. Menedżer odpowie na czacie..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* File Upload */}
          <div className="form-group" style={{ marginTop: "8px" }}>
            <label className="form-label">Załącznik (np. zdjęcie uszkodzenia, skan protokołu)</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <label className="btn btn-secondary" style={{ cursor: "pointer", display: "inline-flex", gap: "8px", height: "38px", alignItems: "center" }}>
                {uploading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Paperclip size={16} />
                )}
                {uploading ? "Wysyłanie..." : "Załącz plik / obraz"}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading || isPending}
                  style={{ display: "none" }}
                />
              </label>

              {fileName && (
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Załączono: <strong>{fileName}</strong>
                </div>
              )}
            </div>
            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .animate-spin {
                animation: spin 1s linear infinite;
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* Form Action buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (shouldWarn) {
              if (window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz opuścić tę stronę?")) {
                router.push("/client/tickets");
              }
            } else {
              router.push("/client/tickets");
            }
          }}
          disabled={isPending}
        >
          Anuluj
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending || uploading}
          style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}
        >
          <Send size={16} />
          {isPending ? "Wysyłanie zgłoszenia..." : "Wyślij zgłoszenie"}
        </button>
      </div>

    </form>
  );
}
