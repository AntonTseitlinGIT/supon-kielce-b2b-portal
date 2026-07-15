"use client";

import React, { useState, useTransition } from "react";
import { Plus, Search, Users, AlertCircle, CheckCircle, Pencil, KeyRound, X } from "lucide-react";
import { createUser, updateUser, resetUserPassword } from "./actions";
import { formatShortDate } from "@/utils/format";

type Role = "BRANCH_HEAD" | "CLIENT_HEAD" | "SUPON_ADMIN";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  clientId: string | null;
  branchId: string | null;
  client: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
}

interface ClientOption { id: string; name: string; }
interface BranchOption { id: string; name: string; clientId: string; }

interface Props {
  users: UserData[];
  clients: ClientOption[];
  branches: BranchOption[];
}

const ROLE_LABELS: Record<Role, string> = {
  SUPON_ADMIN: "Admin SUPON",
  CLIENT_HEAD: "Kierownik Klienta",
  BRANCH_HEAD: "Kierownik Oddziału",
};

const ROLE_BADGE: Record<Role, string> = {
  SUPON_ADMIN: "err",
  CLIENT_HEAD: "badge-info",
  BRANCH_HEAD: "badge-neutral",
};

const CLIENT_ROLES: Role[] = ["CLIENT_HEAD", "BRANCH_HEAD"];
const BRANCH_ROLES: Role[] = ["BRANCH_HEAD"];

export default function UserManageClient({ users, clients, branches }: Props) {
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");

  // Edit mode
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Form fields (shared for create and edit)
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<Role>("SUPON_ADMIN");
  const [formClientId, setFormClientId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const filteredBranches = branches.filter(b => b.clientId === formClientId);

  const isEditMode = !!editUser;

  const startEdit = (user: UserData) => {
    setEditUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormClientId(user.clientId || "");
    setFormBranchId(user.branchId || "");
    setFormIsActive(user.isActive);
    setShowPasswordReset(false);
    setNewPassword("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const cancelEdit = () => {
    setEditUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("SUPON_ADMIN");
    setFormClientId("");
    setFormBranchId("");
    setFormIsActive(true);
    setShowPasswordReset(false);
    setNewPassword("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    if (isEditMode) formData.append("id", editUser!.id);
    formData.append("name", formName);
    formData.append("email", formEmail);
    if (!isEditMode) formData.append("password", formPassword);
    formData.append("role", formRole);
    formData.append("clientId", CLIENT_ROLES.includes(formRole) ? formClientId : "");
    formData.append("branchId", BRANCH_ROLES.includes(formRole) ? formBranchId : "");
    formData.append("isActive", formIsActive.toString());

    startTransition(async () => {
      const result = isEditMode
        ? await updateUser(null, formData)
        : await createUser(null, formData);

      if (result.success) {
        setSuccessMsg(result.message || "Sukces!");
        if (!isEditMode) {
          setFormName("");
          setFormEmail("");
          setFormPassword("");
          setFormRole("SUPON_ADMIN");
          setFormClientId("");
          setFormBranchId("");
        }
      } else {
        setErrorMsg(result.error || "Wystąpił błąd.");
      }
    });
  };

  const handlePasswordReset = () => {
    if (!editUser) return;
    setErrorMsg("");
    setSuccessMsg("");
    startTransition(async () => {
      const result = await resetUserPassword(editUser.id, newPassword);
      if (result.success) {
        setSuccessMsg(result.message || "Hasło zresetowane.");
        setNewPassword("");
        setShowPasswordReset(false);
      } else {
        setErrorMsg(result.error || "Błąd resetowania hasła.");
      }
    });
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || (statusFilter === "active" ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="list-editor-grid">

      {/* Users Table */}
      <div className="card">
        <div className="card-header" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--line)" }}>
          <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={20} style={{ color: "var(--muted)" }} />
            Konta użytkowników ({filtered.length})
          </h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }} aria-hidden="true">
                <Search size={15} />
              </span>
              <input
                type="search"
                className="form-input"
                style={{ paddingLeft: "32px", height: "36px", fontSize: "13px", width: "200px" }}
                placeholder="Szukaj po nazwie / e-mail..."
                aria-label="Szukaj użytkowników"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-input"
              style={{ height: "36px", fontSize: "13px" }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | "")}
              aria-label="Filtruj wg roli"
            >
              <option value="">Wszystkie role</option>
              {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ height: "36px", fontSize: "13px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filtruj wg statusu"
            >
              <option value="">Wszyscy</option>
              <option value="active">Aktywni</option>
              <option value="inactive">Nieaktywni</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Użytkownik</th>
                <th>Rola</th>
                <th>Klient / Oddział</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "right" }}>Data utworzenia</th>
                <th style={{ textAlign: "right" }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    Brak użytkowników spełniających wybrane kryteria.
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} style={{ background: editUser?.id === user.id ? "color-mix(in oklab, var(--accent) 6%, var(--page-bg))" : undefined }}>
                    <td>
                      <div className="row-10">
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: "var(--accent)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "13px", flexShrink: 0,
                        }}>
                          {user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>{user.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[user.role]}`} style={{ fontSize: "11px" }}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", color: "var(--muted)" }}>
                      {user.client ? (
                        <div>
                          <div style={{ fontWeight: 500, color: "var(--text)" }}>{user.client.name.split("—")[0].trim()}</div>
                          {user.branch && <div style={{ fontSize: "12px" }}>{user.branch.name}</div>}
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>SUPON (wewnętrzny)</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${user.isActive ? "ok" : "err"}`} style={{ fontSize: "11px" }}>
                        {user.isActive ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontSize: "13px", color: "var(--muted)" }}>
                      {formatShortDate(user.createdAt)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", gap: "4px" }}
                        onClick={() => startEdit(user)}
                      >
                        <Pencil size={12} /> Edytuj
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Panel */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: "1px solid var(--line)" }}>
          <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="row-8">
              {isEditMode ? <Pencil size={16} style={{ color: "var(--accent)" }} /> : <Plus size={18} style={{ color: "var(--accent)" }} />}
              {isEditMode ? `Edytuj: ${editUser!.name.split(" ")[0]}` : "Nowy użytkownik"}
            </span>
            {isEditMode && (
              <button type="button" onClick={cancelEdit} aria-label="Anuluj edycję" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "2px" }}>
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </h3>
        </div>

        <div className="card-content">
          {errorMsg && (
            <div role="alert" style={{ display: "flex", gap: "8px", background: "color-mix(in oklab, var(--err) 12%, var(--page-bg))", border: "1px solid var(--err)", padding: "10px 14px", borderRadius: "10px", color: "var(--err)", marginBottom: "16px", fontSize: "13px" }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div role="status" aria-live="polite" style={{ display: "flex", gap: "8px", background: "color-mix(in oklab, var(--ok) 12%, var(--page-bg))", border: "1px solid var(--ok)", padding: "10px 14px", borderRadius: "10px", color: "var(--ok)", marginBottom: "16px", fontSize: "13px" }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label form-required" htmlFor="um-name">Imię i nazwisko</label>
              <input
                id="um-name"
                type="text"
                className="form-input"
                placeholder="np. Jan Kowalski"
                required
                autoComplete="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-required" htmlFor="um-email">Login</label>
              <input
                id="um-email"
                type="text"
                className="form-input"
                placeholder="np. demo"
                required
                autoComplete="username"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                disabled={isPending}
              />
            </div>

            {!isEditMode && (
              <div className="form-group">
                <label className="form-label form-required" htmlFor="um-password">Hasło (min. 6 znaków)</label>
                <input
                  id="um-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  disabled={isPending}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label form-required" htmlFor="um-role">Rola</label>
              <select
                id="um-role"
                className="form-input"
                required
                value={formRole}
                onChange={(e) => {
                  setFormRole(e.target.value as Role);
                  setFormClientId("");
                  setFormBranchId("");
                }}
                disabled={isPending}
              >
                {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([r, label]) => (
                  <option key={r} value={r}>{label}</option>
                ))}
              </select>
            </div>

            {CLIENT_ROLES.includes(formRole) && (
              <div className="form-group">
                <label className="form-label" htmlFor="um-client">Klient</label>
                <select
                  id="um-client"
                  className="form-input"
                  value={formClientId}
                  onChange={(e) => { setFormClientId(e.target.value); setFormBranchId(""); }}
                  disabled={isPending}
                >
                  <option value="">— Wybierz klienta —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name.split("—")[0].trim()}</option>
                  ))}
                </select>
              </div>
            )}

            {BRANCH_ROLES.includes(formRole) && formClientId && (
              <div className="form-group">
                <label className="form-label" htmlFor="um-branch">Oddział</label>
                <select
                  id="um-branch"
                  className="form-input"
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  disabled={isPending}
                >
                  <option value="">— Wybierz oddział —</option>
                  {filteredBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isEditMode && (
              <div className="switch-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <span className="form-label" style={{ margin: 0 }} id="um-active-label">Konto aktywne</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    disabled={isPending}
                    aria-labelledby="um-active-label"
                  />
                  <span className="slider" />
                </label>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "4px" }}
              disabled={isPending}
            >
              {isPending ? "Zapisywanie..." : isEditMode ? "Zapisz zmiany" : "Utwórz użytkownika"}
            </button>
          </form>

          {/* Password reset section (edit mode only) */}
          {isEditMode && (
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
              {!showPasswordReset ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px" }}
                  onClick={() => setShowPasswordReset(true)}
                >
                  <KeyRound size={14} /> Resetuj hasło
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label className="form-label" htmlFor="um-newpass" style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    <KeyRound size={14} style={{ color: "var(--accent)" }} aria-hidden="true" /> Nowe hasło (min. 6 znaków)
                  </label>
                  <input
                    id="um-newpass"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    minLength={6}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isPending}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: "13px" }}
                      disabled={isPending || newPassword.length < 6}
                      onClick={handlePasswordReset}
                    >
                      {isPending ? "Resetowanie..." : "Ustaw nowe hasło"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: "13px" }}
                      onClick={() => { setShowPasswordReset(false); setNewPassword(""); }}
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
