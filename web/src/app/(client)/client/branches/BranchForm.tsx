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
  const [selectedBranch, setSelectedBranch] = useState<Branch>(
    branches[0] || null
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

    const formData = new FormData();
    formData.append("name", branchName.trim());
    formData.append("address", combinedAddress);

    startTransition(async () => {
      let result;
      if (branchMode === "add") {
        result = await createBranch(null, formData);
      } else {
        formData.append("id", selectedBranch.id);
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
          handleBranchReset();
        }
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

    const formData = new FormData();
    formData.append("address", combinedAddress);

    startTransition(async () => {
      let result;
      if (addressMode === "add") {
        formData.append("branchId", selectedBranch.id);
        result = await createDeliveryAddress(null, formData);
      } else {
        formData.append("id", selectedAddressId);
        formData.append("isActive", addressActive.toString());
        result = await updateDeliveryAddress(null, formData);
      }

      if (result.success) {
        setSuccessMsg(result.message || "Adres dostawy zapisany!");
        handleAddressReset();
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
      
      {/* LEFT COLUMN: Branches / Address List */}
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
              <h3 className="card-title row-8">
                <Shield size={18} style={{ color: "var(--accent)" }} /> Oddziały firmy
              </h3>
              {branchMode === "edit" && (
                <button className="btn btn-secondary btn-sm" onClick={handleBranchReset}>
                  Dodaj nowy oddział
                </button>
              )}
            </div>
            
            <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
              <table className="table">
                <thead>
                  <tr style={{ background: "var(--section-bg)" }}>
                    <th>Nazwa</th>
                    <th>Adres rejestracyjny</th>
                    <th style={{ textAlign: "center" }}>Pracownicy</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr 
                      key={b.id} 
                      style={{ 
                        borderBottom: "1px solid var(--line)",
                        background: selectedBranch?.id === b.id ? "color-mix(in oklab, var(--accent) 5%, transparent)" : "transparent"
                      }}
                    >
                      <td style={{ fontWeight: 700, color: "var(--text)" }}>
                        <button 
                          type="button" 
                          onClick={() => setSelectedBranch(b)}
                          style={{ background: "none", border: "none", color: "inherit", font: "inherit", fontWeight: "inherit", textAlign: "left", cursor: "pointer", padding: 0 }}
                        >
                          {b.name}
                        </button>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "13px", lineHeight: "1.4", whiteSpace: "pre-line" }}>{b.address}</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{b._count?.employees ?? 0}</td>
                      <td>
                        <span className={`badge ${b.isActive ? "badge-success" : "badge-danger"}`}>
                          {b.isActive ? "Aktywny" : "Nieaktywny"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBranch(b)}>
                            Adresy
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleBranchEditClick(b)}>
                            Edytuj
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DELIVERY ADDRESSES FOR SELECTED BRANCH */}
        {selectedBranch && (
          <div className="card" style={{ border: "1px solid var(--line)" }}>
            <div className="card-header">
              <h3 className="card-title row-8">
                <Home size={18} style={{ color: "var(--accent)" }} /> Adresy dostaw dla: {selectedBranch.name}
              </h3>
            </div>

            <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
              {selectedBranch.deliveryAddresses.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
                  Brak dodatkowych adresów dostawy. Wykorzystywany jest główny adres oddziału.
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr style={{ background: "var(--section-bg)" }}>
                      <th style={{ width: "60px" }}>Lp.</th>
                      <th>Szczegóły adresu</th>
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
        )}

      </div>

      {/* RIGHT COLUMN: Address Form & Branch Form */}
      <div className="col-24">
        
        {/* FEEDBACK STATUS */}
        {(errorMsg || successMsg) && (
          <div className="card" style={{ padding: "16px", border: "1px solid var(--line)", background: "var(--page-bg)" }}>
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

        {/* 1. Branch Form (only for CLIENT_HEAD, or read-only/hidden for branch head) */}
        {!isBranchHead && (
          <div className="card" style={{ border: "1px solid var(--line)" }}>
            <div className="card-header">
              <h3 className="card-title">
                {branchMode === "add" ? "Dodaj oddział" : "Edytuj oddział"}
              </h3>
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
                {branchMode === "edit" && (
                  <div className="switch-container">
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
                )}
                <button type="submit" className="btn btn-primary" disabled={isPending} style={{ width: "100%" }}>
                  {branchMode === "add" ? "Stwórz oddział" : "Zapisz oddział"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2. Address Editor Form */}
        {selectedBranch && (
          <div className="card" style={{ border: "1px solid var(--line)" }}>
            <div className="card-header">
              <h3 className="card-title">
                {addressMode === "add" ? "Nowy adres dostawy" : "Edytuj adres dostawy"}
              </h3>
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

                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px" }}>
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
                      autoComplete="postal-code"
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
                      autoComplete="address-level2"
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

                {addressMode === "edit" && (
                  <div className="switch-container">
                    <span className="switch-label" id="bf-addr-active-label">Adres aktywny</span>
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
                )}

                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  {addressMode === "edit" && (
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleAddressReset}>
                      Anuluj
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
                    {addressMode === "add" ? "Dodaj adres" : "Zapisz adres"}
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
