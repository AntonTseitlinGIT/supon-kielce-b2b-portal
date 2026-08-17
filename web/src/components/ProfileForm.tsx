"use client";

import React, { useState, useTransition } from "react";
import { User, Mail, Lock, Shield, Building, Save, KeyRound, Loader2, Check } from "lucide-react";
import { updateUserProfile } from "@/app/actions/profile";
import { useToast } from "@/components/ToastProvider";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    clientName?: string | null;
    branchName?: string | null;
  };
}

const ROLE_DISPLAY: Record<string, string> = {
  BRANCH_HEAD: "Kierownik Oddziału",
  CLIENT_HEAD: "Dyrektor Centrali",
  SUPON_ADMIN: "Administrator SUPON S.A.",
  SUPON_DEV: "Deweloper Platformy",
};

export default function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isPending, startTransition] = useTransition();
  const { showSuccess, showError } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      showError("Nowe hasło i jego powtórzenie nie są identyczne.");
      return;
    }

    startTransition(async () => {
      const res = await updateUserProfile({
        name,
        email,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (res.success) {
        showSuccess("Twój profil został pomyślnie zaktualizowany!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showError(res.error || "Błąd podczas zapisywania zmian.");
      }
    });
  };

  const roleText = ROLE_DISPLAY[user.role] ?? user.role;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Account Info Banner */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          padding: "20px 24px",
          background: "var(--card-bg, #ffffff)",
          borderRadius: "16px",
          border: "1px solid var(--line, #e2e8f0)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent, #2563eb), #6366f1)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: "18px",
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
            {user.name}
          </h3>
          <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "var(--muted)", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Shield size={14} style={{ color: "var(--accent)" }} /> {roleText}
            </span>
            {user.clientName && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Building size={14} /> {user.clientName}
                {user.branchName ? ` (${user.branchName})` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Basic Profile Details Section */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
          <User size={20} style={{ color: "var(--accent)" }} />
          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
            Dane osobowe
          </h4>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div>
            <label className="form-label" htmlFor="user-name">
              Imię i nazwisko <span style={{ color: "var(--err)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="user-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jan Kowalski"
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="user-email">
              Adres e-mail / Login <span style={{ color: "var(--err)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="user-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jan.kowalski@firma.pl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
          <KeyRound size={20} style={{ color: "var(--warn, #d97706)" }} />
          <div>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              Zmiana hasła (opcjonalnie)
            </h4>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Wypełnij te pola tylko, jeśli chcesz zmienić obecne hasło dostępowe
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          <div>
            <label className="form-label" htmlFor="current-password">
              Aktualne hasło
            </label>
            <input
              id="current-password"
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="new-password">
              Nowe hasło
            </label>
            <input
              id="new-password"
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 znaków"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="confirm-password">
              Powtórz nowe hasło
            </label>
            <input
              id="confirm-password"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Powtórz nowe hasło"
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending}
          style={{
            height: "46px",
            padding: "0 28px",
            fontSize: "15px",
            fontWeight: 700,
            borderRadius: "12px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Zapisywanie...
            </>
          ) : (
            <>
              <Save size={18} /> Zapisz zmiany profilu
            </>
          )}
        </button>
      </div>
    </form>
  );
}
