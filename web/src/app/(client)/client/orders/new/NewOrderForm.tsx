"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createOrder } from "./actions";
import { Priority } from "@prisma/client";
import { Plus, Trash2, AlertTriangle, ShieldCheck, User, X, ChevronRight, ChevronLeft, Check } from "lucide-react";

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

  // Wizard step: 1 = Basic info, 2 = Items, 3 = Summary
  const [step, setStep] = useState(1);

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
  const [isConfirmed, setIsConfirmed] = useState(false);
  
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

  // Calculations for KPIs (only counting items with selected product)
  const filledItems = items.filter(i => i.productId);
  const totalItems = filledItems.length;
  const totalQty = filledItems.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const uniqueEmployees = isBulk ? "Zbiorcze" : new Set(filledItems.map(i => i.employeeId).filter(Boolean)).size;
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

  // Step validation
  const validateStep1 = () => {
    if (!branchId) { setErrorMsg("Wybierz oddział."); return false; }
    if (!address) { setErrorMsg("Adres dostawy jest wymagany."); return false; }
    setErrorMsg("");
    return true;
  };

  const validateStep2 = () => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!isBulk && !item.employeeId) {
        setErrorMsg(`Wiersz ${i + 1}: Wybierz pracownika lub zaznacz zamówienie zbiorcze.`);
        return false;
      }
      if (!item.productId) { setErrorMsg(`Wiersz ${i + 1}: Wybierz produkt.`); return false; }
      if (!item.size) { setErrorMsg(`Wiersz ${i + 1}: Wybierz rozmiar.`); return false; }
      if (item.quantity <= 0) { setErrorMsg(`Wiersz ${i + 1}: Ilość musi być większa od zera.`); return false; }
    }
    setErrorMsg("");
    return true;
  };

  // Submit Order
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) return;
    if (!isConfirmed) {
      setErrorMsg("Musisz potwierdzić poprawność danych przed wysłaniem zamówienia.");
      return;
    }
    if (!window.confirm("Czy na pewno chcesz zatwierdzić i wysłać zamówienie do SUPON Kielce?")) {
      return;
    }
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
        setErrorMsg(`Wiersz ${i + 1}: Ilość musi być większa od zera.`);
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

  // Prevent accidental submission via Enter key on Steps 1 and 2
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && step < 3) {
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    }
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
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="col-24">
      
      {/* Alert states */}
      {errorMsg && (
        <div role="alert" className="badge badge-danger" style={{ padding: "12px 18px", borderRadius: "var(--radius)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
          <AlertTriangle size={18} aria-hidden="true" />
          <strong>Błąd:</strong> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div role="status" aria-live="polite" className="badge badge-success" style={{ padding: "12px 18px", borderRadius: "var(--radius)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
          <ShieldCheck size={18} aria-hidden="true" />
          {successMsg}
        </div>
      )}

      {/* Stepper */}
      <div className="card" style={{ padding: "16px 24px", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          {([
            { n: 1, label: "Dane podstawowe" },
            { n: 2, label: "Pozycje zamówienia" },
            { n: 3, label: "Podsumowanie" },
          ]).map(({ n, label }, idx) => (
            <React.Fragment key={n}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", minWidth: "90px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: step >= n ? "var(--accent)" : "var(--line)",
                  color: step >= n ? "#fff" : "var(--muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "14px", transition: "all 0.2s ease", flexShrink: 0,
                }}>
                  {step > n ? <Check size={16} /> : n}
                </div>
                <span style={{ fontSize: "12px", fontWeight: step === n ? 700 : 500, color: step === n ? "var(--text)" : "var(--muted)", textAlign: "center", whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </div>
              {idx < 2 && (
                <div style={{ flex: 1, height: "2px", background: step > n ? "var(--accent)" : "var(--line)", margin: "15px 8px 0", transition: "background 0.2s ease" }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 1 && (
      <section className="card" aria-label="Dane zamówienia" style={{ border: "1px solid var(--line)" }}>
        <header className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Dane zamówienia</h2>
        </header>
        <div className="card-content" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Adres dostawy select */}
          <div className="form-group">
            <label className="form-label" htmlFor="no-branch" style={{ fontWeight: 600, fontSize: "13px" }}>Oddział</label>
            <select
              id="no-branch"
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
              <label className="form-label" htmlFor="no-address" style={{ fontWeight: 600, fontSize: "13px" }}>Adres dostawy</label>
              <select
                id="no-address"
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
            <label className="form-label" htmlFor="no-department" style={{ fontWeight: 600, fontSize: "13px" }}>Zakład / Dział</label>
            <input
              id="no-department"
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
              <label className="form-label" htmlFor="no-date" style={{ fontWeight: 600, fontSize: "13px" }}>Preferowana data dostawy</label>
              <input
                id="no-date"
                type="date"
                className="input"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                disabled={isPending}
                style={{ width: "100%", height: "42px", margin: 0 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="no-priority" style={{ fontWeight: 600, fontSize: "13px" }}>Priorytet</label>
              <select
                id="no-priority"
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
            <label className="form-label" htmlFor="no-ref" style={{ fontWeight: 600, fontSize: "13px" }}>Numer referencyjny Klienta (opcjonalnie)</label>
            <input
              id="no-ref"
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
            <label className="form-label" htmlFor="no-comments" style={{ fontWeight: 600, fontSize: "13px" }}>Komentarz do zamówienia</label>
            <textarea
              id="no-comments"
              className="input"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isPending}
              placeholder="Instrukcje dla magazynu / kompletacji..."
              style={{ width: "100%", margin: 0, padding: "12px" }}
            />
          </div>

        </div>
      </section>
      )}

      {step === 2 && (
      <section className="card items-card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--line)" }}>
        <header className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Pozycje zamówienia</h2>
        </header>

        {/* Toolbar */}
        <div className="items-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", padding: "12px 20px", borderBottom: "1px solid var(--line)", background: "var(--page-bg)" }}>
          <input
            className="input"
            style={{ maxWidth: "380px", margin: 0, height: "38px" }}
            type="search"
            placeholder="Filtruj dodane pozycje..."
            aria-label="Filtruj dodane pozycje"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
          <div className="row-8">
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
                        aria-label={`Pracownik — pozycja ${index + 1}`}
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
                        aria-label={`Produkt — pozycja ${index + 1}`}
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
                        aria-label={`Rozmiar — pozycja ${index + 1}`}
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
                        aria-label={`Ilość — pozycja ${index + 1}`}
                      />
                    </td>

                    {/* Remarks Input */}
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <input
                        type="text"
                        className="input"
                        style={{ margin: 0, width: "100%", height: "38px" }}
                        placeholder="np. wymiana"
                        aria-label={`Uwagi — pozycja ${index + 1}`}
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
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)", display: "flex", gap: "12px", justifyContent: "flex-end", background: "var(--page-bg)" }}>
          <button
            className="btn btn-secondary row-6"
            type="button"
            onClick={() => {
              if (items.length === 1 && !items[0].productId && !items[0].employeeId) return;
              if (confirm("Czy na pewno chcesz usunąć wszystkie pozycje z tabeli?")) {
                setItems([{ key: Date.now().toString(), employeeId: "", productId: "", size: "", quantity: 1, remarks: "" }]);
              }
            }}
            disabled={isPending}
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
      )}

      {step === 3 && (
      <section className="card" aria-label="Podsumowanie" style={{ border: "1px solid var(--line)" }}>
        <header className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Podsumowanie zamówienia</h2>
        </header>
        <div className="card-content" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* KPI summary cards */}
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
              <h3 style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--muted)", fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase" }}>Dostawa (ETA)</h3>
              <div className="value" style={{ fontWeight: 800, fontSize: "16px", color: "var(--accent)", lineHeight: "1.4" }}>{getETAString(priority)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Adres dostawy</h4>
              <p className="muted" style={{ fontWeight: 600, fontSize: "14px", margin: 0 }}>{addressDisplay}</p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Priorytet</h4>
              <span className={`badge ${priority === "CRITICAL" ? "err" : priority === "HIGH" ? "badge-warning" : "ok"}`} style={{ fontSize: "13px", fontWeight: 700 }}>
                {priority === "STANDARD" ? "Standard" : priority === "HIGH" ? "Wysoki" : "Krytyczny"}
              </span>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "16px 0 8px 0", fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Uwagi do zamówienia</h4>
            <div className="card" style={{ borderStyle: "dashed", background: "var(--section-bg)", border: "1px dashed var(--line)", borderRadius: "12px" }}>
              <div className="card-content" style={{ padding: "12px 16px" }}>
                <p className="muted" style={{ margin: 0, fontStyle: "italic", fontSize: "13px" }}>
                  {comments.trim() ? comments : "Brak instrukcji dodatkowych."}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <input
              type="checkbox"
              id="confirm-order-checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              disabled={isPending}
              style={{ marginTop: "4px", width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="confirm-order-checkbox" style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text)", cursor: "pointer", userSelect: "none" }}>
              Potwierdzam poprawność wszystkich danych w zamówieniu i wyrażam zgodę na jego przekazanie do realizacji.
            </label>
          </div>
        </div>
      </section>
      )}

      {/* Step navigation */}
      <div className="card" style={{ padding: "16px 20px", border: "1px solid var(--line)", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        {step > 1 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setErrorMsg(""); setStep(step - 1); }}
            disabled={isPending}
            style={{ height: "42px", padding: "0 20px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ChevronLeft size={16} /> Wróć
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 3 ? (
          <button
            type="button"
            className="btn"
            onClick={() => {
              const valid = step === 1 ? validateStep1() : validateStep2();
              if (valid) setStep(step + 1);
            }}
            disabled={isPending}
            style={{ height: "42px", padding: "0 24px", background: "var(--accent)", color: "#fff", fontWeight: 700, borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            Dalej <ChevronRight size={16} />
          </button>
        ) : (
          <button
            className="btn"
            type="submit"
            disabled={isPending || !isConfirmed}
            style={{ height: "42px", padding: "0 24px", background: isConfirmed ? "var(--accent)" : "var(--line)", color: isConfirmed ? "#fff" : "var(--muted)", fontWeight: 700, borderRadius: "10px", cursor: isConfirmed ? "pointer" : "not-allowed" }}
          >
            {isPending ? "Wysyłanie..." : "Wyślij zamówienie"}
          </button>
        )}
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

    </form>
  );
}
