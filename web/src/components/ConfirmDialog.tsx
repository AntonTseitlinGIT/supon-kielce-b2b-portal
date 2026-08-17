"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { useModalA11y } from "@/hooks/useModalA11y";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    return new Promise<boolean>((resolve) => {
      const normalizedOpts: ConfirmOptions =
        typeof options === "string"
          ? { message: options }
          : options;

      setDialogState({
        isOpen: true,
        options: normalizedOpts,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(
    (result: boolean) => {
      if (dialogState) {
        dialogState.resolve(result);
        setDialogState(null);
      }
    },
    [dialogState]
  );

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialogState?.isOpen && (
        <ConfirmDialogModal
          isOpen={dialogState.isOpen}
          options={dialogState.options}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialogModal({
  isOpen,
  options,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const modalRef = useModalA11y<HTMLDivElement>({ isOpen, onClose: onCancel });

  const isDanger = options.variant === "danger";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "grid",
        placeItems: "center",
        padding: "16px",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        tabIndex={-1}
        style={{
          width: "min(460px, 94vw)",
          background: "var(--card-bg, #ffffff)",
          color: "var(--text, #0f172a)",
          borderRadius: "20px",
          border: "1px solid var(--line, #e2e8f0)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          animation: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              background: isDanger ? "#fee2e2" : "#eff6ff",
              color: isDanger ? "#dc2626" : "#2563eb",
            }}
          >
            {isDanger ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              id="confirm-title"
              style={{
                margin: "0 0 6px",
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text, #0f172a)",
              }}
            >
              {options.title || (isDanger ? "Potwierdź usunięcie / zmianę" : "Potwierdzenie")}
            </h3>
            <p
              id="confirm-message"
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: 1.5,
                color: "var(--muted, #64748b)",
              }}
            >
              {options.message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "8px",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            style={{
              height: "42px",
              padding: "0 20px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {options.cancelText || "Anuluj"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn"
            style={{
              height: "42px",
              padding: "0 20px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              background: isDanger ? "#dc2626" : "var(--accent, #2563eb)",
              color: "#ffffff",
              border: "none",
            }}
          >
            {options.confirmText || "Potwierdź"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }
  return context;
}
