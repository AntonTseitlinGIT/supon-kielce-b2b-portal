"use client";

import React from "react";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  label?: string;
  className?: string;
}

export default function PrintButton({
  label = "Drukuj / Zapisz PDF",
  className = "btn btn-primary",
}: PrintButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button onClick={handlePrint} className={className}>
      <Printer size={16} /> {label}
    </button>
  );
}
