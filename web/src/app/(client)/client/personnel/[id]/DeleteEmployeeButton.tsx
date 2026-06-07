"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteEmployee } from "../actions";

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

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć pracownika ${employeeName}? Tej operacji nie można cofnąć.`
    );

    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteEmployee(employeeId);
      if (res.success) {
        router.push("/client/personnel");
      } else {
        alert(res.error || "Wystąpił błąd podczas usuwania pracownika.");
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
