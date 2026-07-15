"use client";

import React, { useState, useTransition } from "react";
import { Plus, Edit2, AlertCircle, CheckCircle, Shield, Trash2, Home } from "lucide-react";
import { 
  createBranch, 
  updateBranch,
  createDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress 
} from "./actions";

interface DeliveryAddress {
  id: string;
  address: string;
  isActive: boolean;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  deliveryAddresses: DeliveryAddress[];
  _count?: {
    employees: number;
    orders: number;
  };
}

interface BranchFormProps {
  branches: Branch[];
  userRole: string;
}

export default function BranchForm({ branches, userRole }: BranchFormProps) {
  const [isPending, startTransition] = useTransition();

  const isBranchHead = userRole === "BRANCH_HEAD";

  // Active selected branch for editing addresses
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(
    branches[0] || null
  );

  const [panelState, setPanelState] = useState<"details" | "add-branch" | "edit-branch" | "add-address" | "edit-address">(
    branches.length === 0 ? "add-branch" : "details"
  );

  // Mode for branch: "add" | "edit"
  const [branchMode, setBranchMode] = useState<"add" | "edit">(
    isBranchHead ? "edit" : "add"
  );
  
  // Helper to parse address
  const parseBranchAddress = (addrString: string) => {
    if (!addrString) return { street: "", postalCode: "", city: "" };
    const parts = addrString.split("\n");
    if (parts.length >= 3) {
      return {
        street: parts[0] || "",
        postalCode: parts[1] || "",
        city: parts[2] || ""
      };
    }
    // Fallback for old comma-separated format
    const commaParts = addrString.split(",");
    const street = commaParts[0]?.trim() || "";
    const rest = commaParts[1]?.trim() || "";
    const postalMatch = rest.match(/\d{2}-\d{3}/);
    if (postalMatch) {
      const pc = postalMatch[0];
      const c = rest.replace(pc, "").trim();
      return { street, postalCode: pc, city: c };
    }
    return { street, postalCode: "", city: rest };
  };

  // Branch fields
  const [branchName, setBranchName] = useState(
    isBranchHead && branches[0] ? branches[0].name : ""
  );
  const initialAddr = isBranchHead && branches[0] 
    ? parseBranchAddress(branches[0].address)
    : { street: "", postalCode: "", city: "" };

  const [branchStreet, setBranchStreet] = useState(initialAddr.street);
  const [branchPostalCode, setBranchPostalCode] = useState(initialAddr.postalCode);
  const [branchCity, setBranchCity] = useState(initialAddr.city);

  const [branchActive, setBranchActive] = useState(
    isBranchHead && branches[0] ? branches[0].isActive : true
  );

  // Mode for address: "add" | "edit"
  const [addressMode, setAddressMode] = useState<"add" | "edit">("add");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  
  // Structured Address Fields
  const [recipientName, setRecipientName] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [addressActive, setAddressActive] = useState(true);

  // Status feedback messages
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleBranchEditClick = (branch: Branch) => {
    setBranchMode("edit");
    setSelectedBranch(branch);
    setBranchName(branch.name);
    const parsed = parseBranchAddress(branch.address);
    setBranchStreet(parsed.street);
    setBranchPostalCode(parsed.postalCode);
    setBranchCity(parsed.city);
    setBranchActive(branch.isActive);
    setErrorMsg("");
    setSuccessMsg("");
    setPanelState("edit-branch");
  };

  const handleBranchReset = () => {
    setBranchMode("add");
    setBranchName("");
    setBranchStreet("");
    setBranchPostalCode("");
    setBranchCity("");
    setBranchActive(true);
    setErrorMsg("");
    setSuccessMsg("");
    setPanelState("add-branch");
  };

  const handleAddressEditClick = (addr: DeliveryAddress) => {
    setAddressMode("edit");
    setSelectedAddressId(addr.id);
    setAddressActive(addr.isActive);
    
    // Parse address fields from newline-separated string
    const parts = addr.address.split("\n");
    setRecipientName(parts[0] || "");
    setStreet(parts[1] || "");
    setPostalCode(parts[2] || "");
    setCity(parts[3] || "");
    setContactPerson(parts[4] || "");
    
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleAddressReset = () => {
    setAddressMode("add");
    setSelectedAddressId("");
    setRecipientName("");
    setStreet("");
    setPostalCode("");
    setCity("");
    setContactPerson("");
    setAddressActive(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (isBranchHead) {
      setErrorMsg("Kierownik oddziału nie może modyfikować głównych danych oddziału.");
      return;
    }

    if (!branchName.trim()) {
      setErrorMsg("Nazwa oddziału jest wymagana.");
      return;
    }
    if (!branchStreet.trim() || !branchPostalCode.trim() || !branchCity.trim()) {
      setErrorMsg("Wszystkie pola głównego adresu (ulica, kod pocztowy, miasto) są wymagane.");
      return;
    }

    const combinedAddress = [
      branchStreet.trim(),
      branchPostalCode.trim(),
      branchCity.trim()
    ].join("\n");

    const branchId = selectedBranch?.id;

    const formData = new FormData();
    formData.append("name", branchName.trim());
    formData.append("address", combinedAddress);

    startTransition(async () => {
      let result;
      if (branchMode === "add") {
        result = await createBranch(null, formData);
      } else {
        formData.append("id", branchId || "");
        formData.append("isActive", branchActive.toString());
        result = await updateBranch(null, formData);
      }

      if (result.success) {
        setSuccessMsg(result.message || "Pomyślnie zaktualizowano oddział!");
        if (branchMode === "add") {
          setBranchName("");
          setBranchStreet("");
          setBranchPostalCode("");
          setBranchCity("");
        } else {
          setSelectedBranch(prev => prev ? {
            ...prev,
            name: branchName.trim(),
            address: combinedAddress,
            isActive: branchActive
          } : null);
          setBranchMode("add");
          setBranchName("");
          setBranchStreet("");
          setBranchPostalCode("");
          setBranchCity("");
          setBranchActive(true);
        }
        setPanelState("details");
      } else {
        setErrorMsg(result.error || "Wystąpił błąd.");
      }
    });
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedBranch) {
      setErrorMsg("Wybierz oddział.");
      return;
    }

    if (!recipientName.trim() || !street.trim() || !postalCode.trim() || !city.trim()) {
      setErrorMsg("Pola Odbiorca, Ulica, Kod pocztowy i Miasto są wymagane.");
      return;
    }

    const combinedAddress = [
      recipientName.trim(),
      street.trim(),
      postalCode.trim(),
      city.trim(),
      contactPerson.trim()
    ].join("\n");

    const branchId = selectedBranch.id;

    const formData = new FormData();
    formData.append("address", combinedAddress);

    startTransition(async () => {
      let result;
      if (addressMode === "add") {
        formData.append("branchId", branchId);
        result = await createDeliveryAddress(null, formData);
      } else {
        formData.append("id", selectedAddressId);
        formData.append("isActive", addressActive.toString());
        result = await updateDeliveryAddress(null, formData);
      }

      if (result.success) {
        setSuccessMsg(result.message || "Adres dostawy zapisany!");
        handleAddressReset();
        setPanelState("details");
      } else {
        setErrorMsg(result.error || "Wystąpił błąd.");
      }
    });
  };

  const handleAddressDelete = (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten adres dostawy?")) return;

    setErrorMsg("");
    setSuccessMsg("");
    const formData = new FormData();
    formData.append("id", id);

    startTransition(async () => {
      const result = await deleteDeliveryAddress(null, formData);
      if (result.success) {
        setSuccessMsg("Adres dostawy został usunięty!");
        handleAddressReset();
      } else {
        setErrorMsg(result.error || "Nie udało się usunąć adresu.");
      }
    });
  };

  return (
    <div className="list-editor-grid" style={{ gap: "28px" }}>
      
      {/* LEFT COLUMN: Branches Master List */}
      <div className="col-24">
        
        {/* Branch selector or Branch Info (if branch head) */}
        {isBranchHead ? (
          <div className="card" style={{ border: "1px solid var(--line)", padding: "20px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>Twój Oddział: {selectedBranch?.name}</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", whiteSpace: "pre-line" }}>
              <strong>Główny adres rejestracyjny:</strong><br />
              {selectedBranch?.address}
            </p>
          </div>
        ) : (
          <div className="card" style={{ border: "1px solid var(--line)" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title row-8" style={{ margin: 0 }}>
                <Shield size={18} style={{ color: "var(--accent)" }} /> Oddziały firmy
              </h3>
              {panelState !== "add-branch" && (
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleBranchReset}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  + Dodaj oddział
                </button>
              )}
            </div>
            
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {branches.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                  Brak oddziałów. Dodaj pierwszy oddział.
                </div>
              ) : (
                branches.map((b) => {
                  const isSelected = selectedBranch?.id === b.id;
                  const parsed = parseBranchAddress(b.address);
                  const formattedAddress = `${parsed.street}, ${parsed.postalCode} ${parsed.city}`;
                  return (
                    <div 
                      key={b.id}
                      onClick={() => {
                        setSelectedBranch(b);
                        setPanelState("details");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      style={{
                        padding: "16px",
                        borderRadius: "var(--radius)",
                        border: isSelected ? "2px solid var(--accent)" : "1px solid var(--line)",
                        background: isSelected ? "color-mix(in oklab, var(--accent) 4%, var(--page-bg))" : "var(--page-bg)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        boxShadow: isSelected ? "var(--shadow-sm)" : "none"
                      }}
                      className="branch-list-item"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text)" }}>
                          {b.name}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={`badge ${b.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: "11px", padding: "2px 6px" }}>
                            {b.isActive ? "Aktywny" : "Nieaktywny"}
                          </span>
                          <button 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBranchEditClick(b);
                            }}
                          >
                            Edytuj
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", whiteSpace: "pre-line" }}>
                        {formattedAddress}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", gap: "12px", marginTop: "4px", borderTop: "1px solid var(--line)", paddingTop: "8px" }}>
                        <span>Pracownicy: <strong>{b._count?.employees ?? 0}</strong></span>
                        <span>Zamówienia: <strong>{b._count?.orders ?? 0}</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Details & Forms depending on panelState */}
      <div className="col-24">
        
        {/* FEEDBACK STATUS */}
        {(errorMsg || successMsg) && (
          <div className="card" style={{ padding: "16px", border: "1px solid var(--line)", background: "var(--page-bg)", marginBottom: "16px" }}>
            {errorMsg && (
              <div role="alert" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--err)", fontSize: "14px" }}>
                <AlertCircle size={16} aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ok)", fontSize: "14px" }}>
                <CheckCircle size={16} aria-hidden="true" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* DETAILS VIEW */}
        {panelState === "details" && selectedBranch && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Branch Details Card */}
            <div className="card" style={{ border: "1px solid var(--line)" }}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="card-title" style={{ margin: 0 }}> Szczegóły oddziału: {selectedBranch.name}</h3>
                {!isBranchHead && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleBranchEditClick(selectedBranch)}
                  >
                    Edytuj oddział
                  </button>
                )}
              </div>
              <div className="card-content" style={{ padding: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                  <div>
                    <strong style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase" }}>Główny adres dostawy (rejestracyjny)</strong>
                    <div style={{ 
                      marginTop: "6px", 
                      padding: "12px", 
                      background: "var(--section-bg)", 
                      borderRadius: "var(--radius)", 
                      fontSize: "14px",
                      lineHeight: "1.5",
                      whiteSpace: "pre-line"
                    }}>
                      {selectedBranch.address}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Addresses List Card */}
            <div className="card" style={{ border: "1px solid var(--line)" }}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="card-title row-8" style={{ margin: 0 }}>
                  <Home size={18} style={{ color: "var(--accent)" }} /> Dodatkowe adresy dostaw
                </h3>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    handleAddressReset();
                    setPanelState("add-address");
                  }}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  + Dodaj adres
                </button>
              </div>

              <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
                {selectedBranch.deliveryAddresses.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
                    Brak dodatkowych adresów dostawy. Wszystkie zamówienia tego oddziału są dostarczane na jego główny adres powyżej.
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr style={{ background: "var(--section-bg)" }}>
                        <th style={{ width: "60px" }}>Lp.</th>
                        <th>Adres dostawy</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                        <th style={{ textAlign: "right" }}>Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBranch.deliveryAddresses.map((addr, idx) => (
                        <tr key={addr.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ color: "var(--muted)", fontWeight: 600 }}>{idx + 1}.</td>
                          <td style={{ color: "var(--text)", fontSize: "13.5px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                            {addr.address}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`badge ${addr.isActive ? "badge-success" : "badge-neutral"}`}>
                              {addr.isActive ? "Aktywny" : "Nieaktywny"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleAddressEditClick(addr)}>
                                Edytuj
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleAddressDelete(addr.id)}
                                style={{
                                  color: "var(--err)",
                                  borderColor: "color-mix(in oklab, var(--err) 30%, var(--line))",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "36px",
                                  padding: 0
                                }}
                                title="Usuń adres"
                                aria-label="Usuń adres dostawy"
                              >
                                <Trash2 size={15} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ADD BRANCH FORM */}
        {panelState === "add-branch" && (
          <div className="card" style={{ border: "1px solid var(--line)" }}>
            <div className="card-header">
              <h3 className="card-title">Dodaj nowy oddział</h3>
            </div>
            <div className="card-content" style={{ padding: "20px" }}>
              <form onSubmit={handleBranchSubmit} className="col-12">
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-name">Nazwa oddziału</label>
                  <input
                    id="bf-name"
                    type="text"
                    className="form-input"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="np. Zakład Północny Kielce"
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-branch-street">Ulica i numer</label>
                  <input
                    id="bf-branch-street"
                    type="text"
                    className="form-input"
                    value={branchStreet}
                    onChange={(e) => setBranchStreet(e.target.value)}
                    placeholder="np. ul. Fabryczna 10"
                    disabled={isPending}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px", marginBottom: "15px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bf-branch-postal">Kod pocztowy</label>
                    <input
                      id="bf-branch-postal"
                      type="text"
                      inputMode="numeric"
                      className="form-input"
                      value={branchPostalCode}
                      onChange={(e) => setBranchPostalCode(e.target.value)}
                      placeholder="00-000"
                      disabled={isPending}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bf-branch-city">Miasto</label>
                    <input
                      id="bf-branch-city"
                      type="text"
                      className="form-input"
                      value={branchCity}
                      onChange={(e) => setBranchCity(e.target.value)}
                      placeholder="Kielce"
                      disabled={isPending}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPanelState(branches.length > 0 ? "details" : "add-branch")}>
                    Anuluj
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
                    Stwórz oddział
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT BRANCH FORM */}
        {panelState === "edit-branch" && (
          <div className="card" style={{ border: "1px solid var(--line)" }}>
            <div className="card-header">
              <h3 className="card-title">Edytuj oddział: {selectedBranch?.name}</h3>
            </div>
            <div className="card-content" style={{ padding: "20px" }}>
              <form onSubmit={handleBranchSubmit} className="col-12">
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-name">Nazwa oddziału</label>
                  <input
                    id="bf-name"
                    type="text"
                    className="form-input"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="np. Zakład 3"
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-branch-street">Ulica i numer</label>
                  <input
                    id="bf-branch-street"
                    type="text"
                    className="form-input"
                    value={branchStreet}
                    onChange={(e) => setBranchStreet(e.target.value)}
                    placeholder="np. ul. Fabryczna 10"
                    disabled={isPending}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px", marginBottom: "15px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bf-branch-postal">Kod pocztowy</label>
                    <input
                      id="bf-branch-postal"
                      type="text"
                      inputMode="numeric"
                      className="form-input"
                      value={branchPostalCode}
                      onChange={(e) => setBranchPostalCode(e.target.value)}
                      placeholder="00-000"
                      disabled={isPending}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bf-branch-city">Miasto</label>
                    <input
                      id="bf-branch-city"
                      type="text"
                      className="form-input"
                      value={branchCity}
                      onChange={(e) => setBranchCity(e.target.value)}
                      placeholder="Kielce"
                      disabled={isPending}
                      required
                    />
                  </div>
                </div>
                <div className="switch-container" style={{ marginBottom: "16px" }}>
                  <span className="switch-label" id="bf-active-label">Aktywny</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={branchActive}
                      onChange={(e) => setBranchActive(e.target.checked)}
                      disabled={isPending}
                      aria-labelledby="bf-active-label"
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPanelState("details")}>
                    Anuluj
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
                    Zapisz oddział
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD DELIVERY ADDRESS FORM */}
        {panelState === "add-address" && (
          <div className="card" style={{ border: "1px solid var(--line)" }}>
            <div className="card-header">
              <h3 className="card-title">Nowy adres dostawy dla: {selectedBranch?.name}</h3>
            </div>
            <div className="card-content" style={{ padding: "20px" }}>
              <form onSubmit={handleAddressSubmit} className="col-12">
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-recipient">Odbiorca / Nazwa</label>
                  <input
                    id="bf-recipient"
                    type="text"
                    className="form-input"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="np. KGHM S.A. Magazyn Główny"
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-street">Ulica i numer</label>
                  <input
                    id="bf-street"
                    type="text"
                    className="form-input"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="np. ul. Fabryczna 10"
                    disabled={isPending}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px", marginBottom: "15px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bf-postal">Kod pocztowy</label>
                    <input
                      id="bf-postal"
                      type="text"
                      inputMode="numeric"
                      className="form-input"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="00-000"
                      disabled={isPending}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bf-city">Miasto</label>
                    <input
                      id="bf-city"
                      type="text"
                      className="form-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Kielce"
                      disabled={isPending}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-contact">Osoba kontaktowa (opcjonalnie)</label>
                  <input
                    id="bf-contact"
                    type="text"
                    className="form-input"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="np. Adam Kowalski"
                    disabled={isPending}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPanelState("details")}>
                    Anuluj
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
                    Dodaj adres
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT DELIVERY ADDRESS FORM */}
        {panelState === "edit-address" && (
          <div className="card" style={{ border: "1px solid var(--line)" }}>
            <div className="card-header">
              <h3 className="card-title">Edytuj adres dostawy</h3>
            </div>
            <div className="card-content" style={{ padding: "20px" }}>
              <form onSubmit={handleAddressSubmit} className="col-12">
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-recipient">Odbiorca / Nazwa</label>
                  <input
                    id="bf-recipient"
                    type="text"
                    className="form-input"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="np. KGHM S.A. Magazyn Główny"
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-street">Ulica i numer</label>
                  <input
                    id="bf-street"
                    type="text"
                    className="form-input"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="np. ul. Fabryczna 10"
                    disabled={isPending}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px", marginBottom: "15px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bf-postal">Kod pocztowy</label>
                    <input
                      id="bf-postal"
                      type="text"
                      inputMode="numeric"
                      className="form-input"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="00-000"
                      disabled={isPending}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bf-city">Miasto</label>
                    <input
                      id="bf-city"
                      type="text"
                      className="form-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Kielce"
                      disabled={isPending}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="bf-contact">Osoba kontaktowa (opcjonalnie)</label>
                  <input
                    id="bf-contact"
                    type="text"
                    className="form-input"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="np. Adam Kowalski"
                    disabled={isPending}
                  />
                </div>
                <div className="switch-container" style={{ marginBottom: "16px" }}>
                  <span className="switch-label" id="bf-addr-active-label">Adres aktivny</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={addressActive}
                      onChange={(e) => setAddressActive(e.target.checked)}
                      disabled={isPending}
                      aria-labelledby="bf-addr-active-label"
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPanelState("details")}>
                    Anuluj
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
                    Zapisz adres
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
