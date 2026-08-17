"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteEmployee } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";

interface DeleteEmployeeButtonProps {
  employeeId: string;
  employeeName: string;
}

export default function DeleteEmployeeButton({
  employeeId,
  employeeName,
}: DeleteEmployeeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { confirm } = useConfirm();
  const { showSuccess, showError } = useToast();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Usuń pracownika",
      message: `Czy na pewno chcesz usunąć pracownika ${employeeName}?`,
      confirmText: "Usuń",
      variant: "danger",
    });

    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteEmployee(employeeId);
      if (res.success) {
        showSuccess("Pracownik został pomyślnie usunięty.");
        router.push("/client/personnel");
      } else {
        showError(res.error || "Wystąpił błąd podczas usuwania pracownika.");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="btn"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        height: "42px",
        background: "#ef4444",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        borderRadius: "8px",
        fontWeight: 600,
        padding: "0 16px",
        opacity: isPending ? 0.7 : 1,
        transition: "background-color 0.2s ease",
      }}
    >
      <Trash2 size={16} />
      {isPending ? "Usuwanie..." : "Usuń pracownika"}
    </button>
  );
}

