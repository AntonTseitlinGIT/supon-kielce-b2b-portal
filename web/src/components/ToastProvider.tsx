"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const showSuccess = useCallback((msg: string) => toast(msg, "success"), [toast]);
  const showError = useCallback((msg: string) => toast(msg, "error"), [toast]);
  const showInfo = useCallback((msg: string) => toast(msg, "info"), [toast]);
  const showWarning = useCallback((msg: string) => toast(msg, "warning"), [toast]);

  return (
    <ToastContext.Provider
      value={{ toast, showSuccess, showError, showInfo, showWarning }}
    >
      {children}
      <div
        className="toast-container"
        aria-live="polite"
        role="status"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "420px",
          width: "calc(100vw - 48px)",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item toast-${t.type}`}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              fontSize: "14px",
              fontWeight: 500,
              color: t.type === "error" ? "#7f1d1d" : t.type === "success" ? "#064e3b" : t.type === "warning" ? "#78350f" : "#1e3a8a",
              background: t.type === "error" ? "#fef2f2" : t.type === "success" ? "#ecfdf5" : t.type === "warning" ? "#fffbeb" : "#eff6ff",
              border: `1px solid ${
                t.type === "error" ? "#fecaca" : t.type === "success" ? "#a7f3d0" : t.type === "warning" ? "#fde68a" : "#bfdbfe"
              }`,
              animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {t.type === "success" && <CheckCircle2 size={20} className="shrink-0" style={{ color: "#059669" }} />}
            {t.type === "error" && <AlertCircle size={20} className="shrink-0" style={{ color: "#dc2626" }} />}
            {t.type === "warning" && <AlertTriangle size={20} className="shrink-0" style={{ color: "#d97706" }} />}
            {t.type === "info" && <Info size={20} className="shrink-0" style={{ color: "#2563eb" }} />}
            <span style={{ flex: 1, wordBreak: "break-word" }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.6,
                color: "inherit",
              }}
              aria-label="Zamknij"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
