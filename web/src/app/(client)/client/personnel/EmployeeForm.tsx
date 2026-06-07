"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEmployee, updateEmployee } from "./actions";
import { EmployeeStatus } from "@prisma/client";
import { AlertTriangle, ShieldCheck, User, Ruler, Briefcase, Fingerprint, Building2 } from "lucide-react";

interface BranchOption {
  id: string;
  name: string;
}

interface EmployeeSizes {
  height?: string;
  chest?: string;
  waist?: string;
  shoes?: string;
  clothing?: string;
}

interface EmployeeData {
  id?: string;
  employeeNr: string;
  name: string;
  jobTitle: string;
  branchId: string;
  status: EmployeeStatus;
  sizes: EmployeeSizes;
  rfid?: boolean;
  address?: string | null;
  photoUrl?: string | null;
}

interface EmployeeFormProps {
  branches: BranchOption[];
  initialData?: EmployeeData;
  userRole: string;
  defaultBranchId?: string;
}

export default function EmployeeForm({
  branches,
  initialData,
  userRole,
  defaultBranchId,
}: EmployeeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Basic info states
  const [employeeNr, setEmployeeNr] = useState(initialData?.employeeNr || "");
  const [name, setName] = useState(initialData?.name || "");
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || "");
  const [branchId, setBranchId] = useState(
    initialData?.branchId || defaultBranchId || branches[0]?.id || ""
  );
  const [status, setStatus] = useState<EmployeeStatus>(initialData?.status || "ACTIVE");

  // Size states
  const [height, setHeight] = useState(initialData?.sizes?.height || "");
  const [chest, setChest] = useState(initialData?.sizes?.chest || "");
  const [waist, setWaist] = useState(initialData?.sizes?.waist || "");
  const [shoes, setShoes] = useState(initialData?.sizes?.shoes || "");
  const [clothing, setClothing] = useState(initialData?.sizes?.clothing || "");

  // Helper states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isEdit = !!initialData?.id;

  const isDirty =
    employeeNr !== (initialData?.employeeNr || "") ||
    name !== (initialData?.name || "") ||
    jobTitle !== (initialData?.jobTitle || "") ||
    branchId !== (initialData?.branchId || defaultBranchId || branches[0]?.id || "") ||
    status !== (initialData?.status || "ACTIVE") ||
    height !== (initialData?.sizes?.height || "") ||
    chest !== (initialData?.sizes?.chest || "") ||
    waist !== (initialData?.sizes?.waist || "") ||
    shoes !== (initialData?.sizes?.shoes || "") ||
    clothing !== (initialData?.sizes?.clothing || "");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!employeeNr) {
      setErrorMsg("Numer ewidencyjny jest wymagany.");
      return;
    }
    if (!name) {
      setErrorMsg("Imię i nazwisko są wymagane.");
      return;
    }
    if (!jobTitle) {
      setErrorMsg("Stanowisko jest wymagane.");
      return;
    }
    if (!branchId) {
      setErrorMsg("Wybierz oddział.");
      return;
    }

    const payload = {
      employeeNr,
      name,
      jobTitle,
      branchId,
      status,
      rfid: initialData?.rfid || false,
      sizes: {
        height: height || undefined,
        chest: chest || undefined,
        waist: waist || undefined,
        shoes: shoes || undefined,
        clothing: clothing || undefined,
      },
    };

    startTransition(async () => {
      let res;
      if (isEdit) {
        res = await updateEmployee(initialData.id!, payload);
      } else {
        res = await createEmployee(payload);
      }

      if (res.success) {
        setSuccessMsg(
          isEdit
            ? "Dane pracownika zostały pomyślnie zaktualizowane!"
            : "Pracownik został pomyślnie dodany do systemu!"
        );
        
        setTimeout(() => {
          router.push(isEdit ? `/client/personnel/${initialData.id}` : "/client/personnel");
        }, 1500);
      } else {
        setErrorMsg(res.error || "Wystąpił błąd podczas zapisywania danych.");
      }
    });
  };

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
        
        {/* Base Info Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", border: "1px solid var(--line)", padding: "24px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "14px", marginBottom: "4px" }}>
            <div style={{ background: "var(--accent-light)", color: "var(--accent)", width: "40px", height: "40px", borderRadius: "12px", display: "grid", placeItems: "center" }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Dane podstawowe</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>Wprowadź dane identyfikacyjne i personalne pracownika</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label form-required" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Fingerprint size={14} style={{ color: "var(--muted)" }} /> Numer ewidencyjny
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="np. NP-0005"
                value={employeeNr}
                onChange={(e) => setEmployeeNr(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-required" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={14} style={{ color: "var(--muted)" }} /> Imię i nazwisko
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="np. Jan Kowalski"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label form-required" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Briefcase size={14} style={{ color: "var(--muted)" }} /> Stanowisko
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="np. Spawacz, Magazynier"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isPending}
              />
            </div>

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

            <div className="form-group">
              <label className="form-label form-required" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                Status pracownika
              </label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                disabled={isPending}
              >
                <option value="ACTIVE">Aktywny (Zatrudniony)</option>
                <option value="INACTIVE">Nieaktywny (Zawieszony)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sizes Profile Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", border: "1px solid var(--line)", padding: "24px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "14px", marginBottom: "4px" }}>
            <div style={{ background: "var(--accent-light)", color: "var(--accent)", width: "40px", height: "40px", borderRadius: "12px", display: "grid", placeItems: "center" }}>
              <Ruler size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Profil rozmiarów</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>Wprowadź wzrost i wymiary w celu prawidłowego dopasowania odzieży</p>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
            <div className="form-group" style={{ width: "110px", margin: 0 }}>
              <label className="form-label" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>Wzrost (cm)</label>
              <input
                type="text"
                className="form-input"
                placeholder="np. 182"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                disabled={isPending}
                style={{ height: "36px", padding: "0 10px", marginTop: "6px" }}
              />
            </div>

            <div className="form-group" style={{ width: "110px", margin: 0 }}>
              <label className="form-label" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>Klatka (cm)</label>
              <input
                type="text"
                className="form-input"
                placeholder="np. 104"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                disabled={isPending}
                style={{ height: "36px", padding: "0 10px", marginTop: "6px" }}
              />
            </div>

            <div className="form-group" style={{ width: "130px", margin: 0 }}>
              <label className="form-label" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>Obwód pasa (cm)</label>
              <input
                type="text"
                className="form-input"
                placeholder="np. 92"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                disabled={isPending}
                style={{ height: "36px", padding: "0 10px", marginTop: "6px" }}
              />
            </div>

            <div className="form-group" style={{ width: "150px", margin: 0 }}>
              <label className="form-label" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>Rozmiar odzieży</label>
              <input
                type="text"
                className="form-input"
                placeholder="np. L lub 54"
                value={clothing}
                onChange={(e) => setClothing(e.target.value)}
                disabled={isPending}
                style={{ height: "36px", padding: "0 10px", marginTop: "6px" }}
              />
            </div>

            <div className="form-group" style={{ width: "130px", margin: 0 }}>
              <label className="form-label" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>Rozmiar obuwia</label>
              <input
                type="text"
                className="form-input"
                placeholder="np. 43"
                value={shoes}
                onChange={(e) => setShoes(e.target.value)}
                disabled={isPending}
                style={{ height: "36px", padding: "0 10px", marginTop: "6px" }}
              />
            </div>
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
                router.back();
              }
            } else {
              router.back();
            }
          }}
          disabled={isPending}
        >
          Anuluj
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending}
        >
          {isPending ? "Zapisywanie..." : isEdit ? "Zapisz zmiany" : "Dodaj pracownika"}
        </button>
      </div>

    </form>
  );
}