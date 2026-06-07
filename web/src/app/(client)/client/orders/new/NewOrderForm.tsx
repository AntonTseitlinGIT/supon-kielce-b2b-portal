"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createOrder } from "./actions";
import { Priority } from "@prisma/client";
import { Plus, Trash2, AlertTriangle, ShieldCheck, MapPin, Package, User, X } from "lucide-react";

interface DeliveryAddressOption {
  id: string;
  address: string;
}

interface BranchOption {
  id: string;
  name: string;
  address: string;
  deliveryAddresses?: DeliveryAddressOption[];
}

interface ProductOption {
  id: string;
  name: string;
  articleNr: string;
  categoryId: string;
  categoryName: string;
  availableSizes: string[];
  photoUrls?: string[];
}

interface PpeLimitUsageInfo {
  ppeLimit: {
    categoryId: string;
    limitPerPeriod: number;
  };
  usedQty: number;
}

interface EmployeeOption {
  id: string;
  name: string;
  branchId: string;
  sizes: any; // Json { height, chest, waist, shoes, clothing }
  ppeLimitUsage: PpeLimitUsageInfo[];
}

interface ClientLimitOption {
  categoryId: string;
  limitPerPeriod: number;
}

interface NewOrderFormProps {
  branches: BranchOption[];
  products: ProductOption[];
  employees: EmployeeOption[];
  clientLimits: ClientLimitOption[];
  userRole: string;
  defaultBranchId?: string;
}

interface OrderItemRow {
  key: string; // React key
  employeeId: string;
  productId: string;
  size: string;
  quantity: number;
  remarks: string;
}

export default function NewOrderForm({
  branches,
  products,
  employees,
  clientLimits,
  userRole,
  defaultBranchId,
}: NewOrderFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [branchId, setBranchId] = useState(defaultBranchId || branches[0]?.id || "");
  const [priority, setPriority] = useState<Priority>("STANDARD");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("");
  const [clientRef, setClientRef] = useState("");
  const [comments, setComments] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  
  const [items, setItems] = useState<OrderItemRow[]>([
    { key: "1", employeeId: "", productId: "", size: "", quantity: 1, remarks: "" }
  ]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isDirty =
    branchId !== (defaultBranchId || branches[0]?.id || "") ||
    priority !== "STANDARD" ||
    department !== "" ||
    clientRef !== "" ||
    comments !== "" ||
    isBulk !== false ||
    items.length > 1 ||
    (items[0] && (
      items[0].employeeId !== "" ||
      items[0].productId !== "" ||
      items[0].size !== "" ||
      items[0].quantity !== 1 ||
      items[0].remarks !== ""
    ));

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

  // Default preferred date (today)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setPreferredDate(today);
  }, []);

  // Prefill product from query param if available
  useEffect(() => {
    const prodId = searchParams.get("productId");
    if (prodId && products.some(p => p.id === prodId)) {
      setItems([
        { key: "1", employeeId: "", productId: prodId, size: "", quantity: 1, remarks: "" }
      ]);
    }
  }, [searchParams, products]);

  // Update address when branch changes
  useEffect(() => {
    const selectedBranch = branches.find((b) => b.id === branchId);
    if (selectedBranch) {
      setAddress(selectedBranch.address);
    }
  }, [branchId, branches]);

  // Filter employees for the selected branch
  const filteredEmployees = employees.filter((e) => e.branchId === branchId);

  // Set employee to empty string when switching to bulk order
  useEffect(() => {
    if (isBulk) {
      setItems(prevItems => prevItems.map(item => ({ ...item, employeeId: "" })));
    }
  }, [isBulk]);

  // Add a new row to items
  const addRow = () => {
    setItems([
      ...items,
      {
        key: Date.now().toString(),
        employeeId: "",
        productId: "",
        size: "",
        quantity: 1,
        remarks: "",
      },
    ]);
  };

  // Remove a row
  const removeRow = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Update specific field in row
  const updateRow = (index: number, field: keyof OrderItemRow, value: any) => {
    const newItems = [...items];
    const row = { ...newItems[index], [field]: value };
    
    // Reset size if product changes
    if (field === "productId") {
      row.size = "";
    }
    
    newItems[index] = row;
    setItems(newItems);
  };

  // Helper: check PPE limits for a row
  const checkLimit = (row: OrderItemRow) => {
    if (!row.employeeId || !row.productId) return null;

    const employee = employees.find((e) => e.id === row.employeeId);
    const product = products.find((p) => p.id === row.productId);
    if (!employee || !product) return null;

    // Find limit for this product's category
    const limit = clientLimits.find((l) => l.categoryId === product.categoryId);
    if (!limit) return null; // No limit configured for this category

    // Find employee's usage for this limit
    const usage = employee.ppeLimitUsage.find(
      (u) => u.ppeLimit.categoryId === product.categoryId
    );

    const usedQty = usage ? usage.usedQty : 0;
    const limitMax = limit.limitPerPeriod;
    const requestedQty = row.quantity;

    // Sum other rows in this order for the same employee + category
    const otherRowsQty = items.reduce((acc, curr, idx) => {
      const matchProduct = products.find((p) => p.id === curr.productId);
      if (
        curr.employeeId === row.employeeId && 
        matchProduct?.categoryId === product.categoryId && 
        items.indexOf(row) !== idx
      ) {
        return acc + curr.quantity;
      }
      return acc;
    }, 0);

    const totalProposed = usedQty + otherRowsQty + requestedQty;

    if (totalProposed > limitMax) {
      return {
        exceeded: true,
        limitMax,
        usedQty: usedQty + otherRowsQty,
        categoryName: product.categoryName,
      };
    }

    return {
      exceeded: false,
      limitMax,
      usedQty: usedQty + otherRowsQty,
      categoryName: product.categoryName,
    };
  };

  // Helper: get size recommendation based on category
  const getSizeRecommendation = (row: OrderItemRow) => {
    if (!row.employeeId || !row.productId) return null;

    const employee = employees.find((e) => e.id === row.employeeId);
    const product = products.find((p) => p.id === row.productId);
    if (!employee || !product || !employee.sizes) return null;

    const empSizes = employee.sizes as Record<string, string>;
    const catName = product.categoryName.toLowerCase();

    if (catName.includes("obuwie") || catName.includes("buty")) {
      return empSizes.shoes || null;
    } else if (catName.includes("odzież") || catName.includes("ubranie")) {
      return empSizes.clothing || null;
    } else {
      return empSizes.clothing || null;
    }
  };

  // Calculations for KPIs
  const totalItems = items.length;
  const totalQty = items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const uniqueEmployees = isBulk ? "Zbiorcze" : new Set(items.map(i => i.employeeId).filter(Boolean)).size;
  const selectedBranch = branches.find((b) => b.id === branchId);
  const addressDisplay = selectedBranch 
    ? `${selectedBranch.name}${department ? " • " + department : ""}`
    : "—";

  // ETA Calculation
  const getETAString = (prio: Priority) => {
    const date = new Date();
    let days = 5;
    if (prio === "HIGH") days = 2;
    if (prio === "CRITICAL") days = 1;
    
    let count = 0;
    while (count < days) {
      date.setDate(date.getDate() + 1);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) {
        count++;
      }
    }
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Submit Order
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Basic validation
    if (!branchId) {
      setErrorMsg("Wybierz oddział.");
      return;
    }
    if (!address) {
      setErrorMsg("Adres dostawy jest wymagany.");
      return;
    }

    // Validate rows
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!isBulk && !item.employeeId) {
        setErrorMsg(`Wiersz ${i + 1}: Wybierz pracownika lub zaznacz zamówienie zbiorcze.`);
        return;
      }
      if (!item.productId) {
        setErrorMsg(`Wiersz ${i + 1}: Wybierz produkt.`);
        return;
      }
      if (!item.size) {
        setErrorMsg(`Wiersz ${i + 1}: Wybierz rozmiar.`);
        return;
      }
      if (item.quantity <= 0) {
        setErrorMsg(`Wiersz ${i + 1}: Ilość musi быть większa od zera.`);
        return;
      }
    }

    // Prepare inputs
    const orderItems = items.map((i) => ({
      productId: i.productId,
      size: i.size,
      quantity: i.quantity,
      employeeId: i.employeeId || undefined,
      remarks: i.remarks || undefined,
    }));

    startTransition(async () => {
      const res = await createOrder({
        branchId,
        priority,
        address,
        department,
        clientRef,
        comments,
        items: orderItems,
      });

      if (res.success) {
        setSuccessMsg(`Zamówienie ${res.orderNr} zostało pomyślnie utworzone! Trwa przekierowanie...`);
        setTimeout(() => {
          router.push(`/client/orders/${res.orderId}`);
        }, 1500);
      } else {
        setErrorMsg(res.error || "Wystąpił błąd podczas składania zamówienia.");
      }
    });
  };

  // Filter items matching the table search input
  const filteredItems = items.filter(item => {
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    const product = products.find(p => p.id === item.productId);
    const employee = employees.find(e => e.id === item.employeeId);
    
    const productName = product?.name.toLowerCase() || "";
    const productCode = product?.articleNr.toLowerCase() || "";
    const employeeName = employee?.name.toLowerCase() || "";
    const remarksText = item.remarks.toLowerCase();
    
    return productName.includes(q) || productCode.includes(q) || employeeName.includes(q) || remarksText.includes(q);
  });

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Alert states */}
      {errorMsg && (
        <div className="badge badge-danger" style={{ padding: "12px 18px", borderRadius: "var(--radius)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
          <AlertTriangle size={18} />
          <strong>Błąd:</strong> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="badge badge-success" style={{ padding: "12px 18px", borderRadius: "var(--radius)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
          <ShieldCheck size={18} />
          {successMsg}
        </div>
      )}

      {/* 1) DANE ZAMÓWIENIA (Full Width Card) */}
      <section className="card" aria-label="Dane zamówienia" style={{ border: "1px solid var(--line)" }}>
        <header className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Dane zamówienia</h2>
        </header>
        <div className="card-content" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Adres dostawy select */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>Oddział</label>
            <select
              className="input"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={isPending}
              style={{ width: "100%", height: "42px", margin: 0 }}
            >
              <option value="">— Wybierz oddział —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {branchId && (
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>Adres dostawy</label>
              <select
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isPending}
                style={{ width: "100%", height: "42px", margin: 0 }}
              >
                <option value="">— Wybierz adres dostawy —</option>
                {/* Default branch address */}
                {branches.find((b) => b.id === branchId) && (
                  <option value={branches.find((b) => b.id === branchId)!.address}>
                    Główny adres: {branches.find((b) => b.id === branchId)!.address.replace(/\n/g, ", ")}
                  </option>
                )}
                {/* Custom delivery addresses */}
                {branches.find((b) => b.id === branchId)?.deliveryAddresses?.map((addr) => (
                  <option key={addr.id} value={addr.address}>
                    {addr.address.replace(/\n/g, ", ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Zakład / Dział input */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>Zakład / Dział</label>
            <input
              type="text"
              className="input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isPending}
              placeholder="np. Produkcja / Linia A"
              style={{ width: "100%", height: "42px", margin: 0 }}
            />
          </div>

          {/* Preferowana data & Priorytet row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>Preferowana data dostawy</label>
              <input
                type="date"
                className="input"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                disabled={isPending}
                style={{ width: "100%", height: "42px", margin: 0 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>Priorytet</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                disabled={isPending}
                style={{ width: "100%", height: "42px", margin: 0 }}
              >
                <option value="STANDARD">Standard</option>
                <option value="HIGH">Wysoki</option>
                <option value="CRITICAL">Krytyczny</option>
              </select>
            </div>
          </div>

          {/* Numer referencyjny Klienta */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>Numer referencyjny Klienta (opcjonalnie)</label>
            <input
              type="text"
              className="input"
              value={clientRef}
              onChange={(e) => setClientRef(e.target.value)}
              disabled={isPending}
              placeholder="np. MPK-2026-082"
              style={{ width: "100%", height: "42px", margin: 0 }}
            />
          </div>

          {/* Komentarz do zamówienia */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>Komentarz do zamówienia</label>
            <textarea
              className="input"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isPending}
              placeholder="Instrukcje dla magazynu / kompletacji..."
              style={{ width: "100%", margin: 0, padding: "12px" }}
            />
          </div>

          {/* Podsumowanie parametrów bottom cards */}
          <div style={{ marginTop: "8px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: "14px" }}>Podsumowanie parametrów</h4>
            <div className="kpis" style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
              <div className="kpi" style={{ border: "1px dashed var(--line)", borderRadius: "14px", padding: "14px", background: "var(--page-bg)" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--muted)", fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase" }}>Pozycje</h3>
                <div className="value" style={{ fontWeight: 800, fontSize: "22px", color: "var(--text)" }}>{totalItems}</div>
              </div>
              <div className="kpi" style={{ border: "1px dashed var(--line)", borderRadius: "14px", padding: "14px", background: "var(--page-bg)" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--muted)", fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase" }}>Sztuki</h3>
                <div className="value" style={{ fontWeight: 800, fontSize: "22px", color: "var(--text)" }}>{totalQty}</div>
              </div>
              <div className="kpi" style={{ border: "1px dashed var(--line)", borderRadius: "14px", padding: "14px", background: "var(--page-bg)" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--muted)", fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase" }}>Pracownicy</h3>
                <div className="value" style={{ fontWeight: 800, fontSize: "22px", color: "var(--text)" }}>{uniqueEmployees}</div>
              </div>
              <div className="kpi" style={{ border: "1px dashed var(--line)", borderRadius: "14px", padding: "14px", background: "var(--page-bg)" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--muted)", fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase" }}>Adres</h3>
                <div className="value" style={{ fontWeight: 700, fontSize: "12px", color: "var(--text)", lineHeight: "1.3", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }} title={addressDisplay}>{addressDisplay}</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2) POZYCJE ZAMÓWIENIA (Items Table Card) */}
      <section className="card items-card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--line)" }}>
        <header className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Pozycje zamówienia</h2>
        </header>

        {/* Toolbar */}
        <div className="items-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", padding: "12px 20px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <input 
            className="input" 
            style={{ maxWidth: "380px", margin: 0, height: "38px" }} 
            type="search" 
            placeholder="Filtruj dodane pozycje..." 
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
              <span style={{ color: "var(--muted)", fontSize: "13px" }}>Zamówienie zbiorcze (brak przypisania do pracowników)</span>
              <span className="switch" style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", flexShrink: 0 }}>
                <input 
                  type="checkbox" 
                  checked={isBulk}
                  onChange={(e) => setIsBulk(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span className="slider" style={{
                  position: "absolute",
                  cursor: "pointer",
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: isBulk ? "var(--accent)" : "var(--line)",
                  transition: ".3s cubic-bezier(0.16, 1, 0.3, 1)",
                  borderRadius: "24px",
                  border: "1px solid var(--line)"
                }}>
                  <span style={{
                    position: "absolute",
                    content: '""',
                    height: "16px",
                    width: "16px",
                    left: "3px",
                    bottom: "3px",
                    backgroundColor: "#fff",
                    transition: ".3s cubic-bezier(0.16, 1, 0.3, 1)",
                    borderRadius: "50%",
                    transform: isBulk ? "translateX(20px)" : "none",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }} />
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Scrollable Table Wrapper */}
        <div className="items-scroll" style={{ overflowX: "auto" }}>
          <table className="table items" style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: "var(--section-bg)", borderBottom: "2px solid var(--line)" }}>
                <th style={{ width: "230px", padding: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>Pracownik</th>
                <th style={{ width: "250px", padding: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>Produkt z katalogu</th>
                <th style={{ width: "130px", padding: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>Kod art.</th>
                <th style={{ width: "90px", padding: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)", textAlign: "center" }}>Foto</th>
                <th style={{ width: "140px", padding: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>Rozmiar</th>
                <th style={{ width: "90px", padding: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>Ilość</th>
                <th style={{ padding: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>Uwagi</th>
                <th style={{ width: "60px", padding: "12px", textAlign: "center", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>Akcja</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((row, index) => {
                const selectedProduct = products.find((p) => p.id === row.productId);
                const sizeRecommendation = getSizeRecommendation(row);
                const limitStatus = checkLimit(row);
                const productPhoto = selectedProduct?.photoUrls?.[0] || "/placeholder-product.png";

                return (
                  <tr 
                    key={row.key} 
                    style={{ 
                      borderBottom: "1px solid var(--line)", 
                      animation: "rowAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                    }}
                  >
                    {/* Employee select */}
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <select
                        className="input"
                        style={{ margin: 0, width: "100%", height: "38px" }}
                        value={row.employeeId}
                        onChange={(e) => updateRow(index, "employeeId", e.target.value)}
                        disabled={isBulk || isPending}
                      >
                        <option value="">{isBulk ? "— (Zamówienie zbiorcze)" : "-- Wybierz pracownika --"}</option>
                        {filteredEmployees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                      
                      {/* Employee Size recommendation details */}
                      {sizeRecommendation && !isBulk && (
                        <div style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", marginTop: "6px", fontWeight: 500 }}>
                          <User size={12} />
                          Sugerowany: <strong>{sizeRecommendation}</strong>
                        </div>
                      )}
                    </td>

                    {/* Product select */}
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <select
                        className="input"
                        style={{ margin: 0, width: "100%", height: "38px" }}
                        value={row.productId}
                        onChange={(e) => updateRow(index, "productId", e.target.value)}
                        disabled={isPending}
                      >
                        <option value="">Wybierz produkt...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Article Code Badge */}
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <span className="art-code-badge" style={{ 
                        display: "inline-block", 
                        padding: "6px 10px", 
                        background: "var(--section-bg)", 
                        border: "1px solid var(--line)", 
                        borderRadius: "8px", 
                        fontFamily: "monospace", 
                        fontWeight: 700, 
                        fontSize: "12px", 
                        color: "var(--text)"
                      }}>
                        {selectedProduct?.articleNr || "—"}
                      </span>
                    </td>

                    {/* Photo cell */}
                    <td style={{ padding: "12px", verticalAlign: "top", textAlign: "center" }}>
                      <div style={{ position: "relative", width: "56px", height: "56px", margin: "0 auto" }}>
                        <img 
                          className="photo" 
                          src={productPhoto} 
                          alt="Zdjęcie" 
                          style={{
                            width: "56px",
                            height: "56px",
                            border: "1px solid var(--line)",
                            borderRadius: "12px",
                            objectFit: "cover",
                            background: "var(--section-bg)",
                            cursor: "pointer",
                            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)"
                          }}
                        />
                      </div>
                    </td>

                    {/* Size Selector */}
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <select
                        className="input"
                        style={{ margin: 0, width: "100%", height: "38px" }}
                        value={row.size}
                        onChange={(e) => updateRow(index, "size", e.target.value)}
                        disabled={isPending || !row.productId}
                      >
                        <option value="">Wybierz...</option>
                        {selectedProduct?.availableSizes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity */}
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <input
                        type="number"
                        min={1}
                        className="input"
                        style={{ margin: 0, width: "100%", height: "38px" }}
                        value={row.quantity}
                        onChange={(e) => updateRow(index, "quantity", parseInt(e.target.value, 10) || 1)}
                        disabled={isPending}
                      />
                    </td>

                    {/* Remarks Input */}
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <input
                        type="text"
                        className="input"
                        style={{ margin: 0, width: "100%", height: "38px" }}
                        placeholder="np. wymiana"
                        value={row.remarks}
                        onChange={(e) => updateRow(index, "remarks", e.target.value)}
                        disabled={isPending}
                      />
                    </td>

                    {/* Action button */}
                    <td style={{ padding: "12px", verticalAlign: "top", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={isPending || items.length === 1}
                        style={{
                          height: "38px",
                          width: "38px",
                          padding: 0,
                          border: "1px solid color-mix(in oklab, var(--err) 20%, transparent)",
                          color: "var(--err)",
                          background: "transparent",
                          display: "grid",
                          placeItems: "center",
                          borderRadius: "10px",
                          cursor: items.length === 1 ? "not-allowed" : "pointer",
                          opacity: items.length === 1 ? 0.3 : 1,
                          transition: "all 0.2s ease"
                        }}
                        title="Usuń pozycję"
                        className="btn-delete-row"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer actions for table card */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)", display: "flex", gap: "12px", justifyContent: "flex-end", background: "var(--surface)" }}>
          <button 
            className="btn btn-secondary" 
            type="button" 
            onClick={() => {
              if (items.length === 1 && !items[0].productId && !items[0].employeeId) return;
              if (confirm("Czy na pewno chcesz usunąć wszystkie pozycje z tabeli?")) {
                setItems([{ key: Date.now().toString(), employeeId: "", productId: "", size: "", quantity: 1, remarks: "" }]);
              }
            }}
            disabled={isPending}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <X size={14} /> Wyczyść wszystko
          </button>
          <button 
            className="btn" 
            type="button" 
            onClick={addRow}
            disabled={isPending}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--accent)", color: "#fff" }}
          >
            <Plus size={16} /> Dodaj pozycję
          </button>
        </div>
      </section>

      {/* 3) PODSUMOWANIE */}
      <section className="card" aria-label="Podsumowanie" style={{ border: "1px solid var(--line)" }}>
        <header className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Podsumowanie</h2>
        </header>
        <div className="card-content" style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: 700 }}>Adres dostawy</h4>
              <p className="muted" style={{ fontWeight: 600, fontSize: "14px" }}>{addressDisplay}</p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: 700 }}>Podsumowanie ilościowe</h4>
              <ul className="list-summary" style={{ paddingLeft: "20px", margin: "8px 0", display: "grid", gap: "6px", listStyle: "disc" }}>
                <li style={{ fontSize: "14px", color: "var(--text)" }}>Pozycji w tabeli: <strong>{totalItems}</strong></li>
                <li style={{ fontSize: "14px", color: "var(--text)" }}>Łączna ilość sztuk: <strong>{totalQty}</strong></li>
                <li style={{ fontSize: "14px", color: "var(--text)" }}>Priorytet zamówienia: <strong style={{ color: "var(--accent)" }}>{priority === "STANDARD" ? "Standard" : priority === "HIGH" ? "Wysoki" : "Krytyczny"}</strong></li>
                <li style={{ fontSize: "14px", color: "var(--text)" }}>Szacowana dostawa (ETA): <strong>{getETAString(priority)}</strong></li>
              </ul>
            </div>
          </div>

          <h4 style={{ margin: "16px 0 8px 0", fontSize: "14px", fontWeight: 700 }}>Uwagi do zamówienia</h4>
          <div className="card" style={{ borderStyle: "dashed", background: "var(--section-bg)", border: "1px dashed var(--line)", borderRadius: "12px" }}>
            <div className="card-content" style={{ padding: "12px 16px" }}>
              <p className="muted" style={{ margin: 0, fontStyle: "italic", fontSize: "13px" }}>
                {comments.trim() ? comments : "Brak instrukcji dodatkowych."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4) AKCJE */}
      <section className="card" aria-label="Akcje" style={{ border: "1px solid var(--line)" }}>
        <header className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Akcje</h2>
        </header>
        <div className="card-content" style={{ padding: "20px 24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button 
            className="btn" 
            type="submit" 
            disabled={isPending}
            style={{ height: "42px", padding: "0 24px", background: "var(--accent)", color: "#fff", fontWeight: 700, borderRadius: "10px" }}
          >
            {isPending ? "Wysyłanie..." : "Wyślij zamówienie"}
          </button>
          <button 
            className="btn btn-secondary" 
            type="button"
            onClick={() => {
              if (shouldWarn) {
                if (window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz opuścić tę stronę?")) {
                  router.push("/client/orders");
                }
              } else {
                router.push("/client/orders");
              }
            }}
            disabled={isPending}
            style={{ height: "42px", padding: "0 24px", borderRadius: "10px" }}
          >
            Anuluj
          </button>
        </div>
      </section>

    </form>
  );
}
