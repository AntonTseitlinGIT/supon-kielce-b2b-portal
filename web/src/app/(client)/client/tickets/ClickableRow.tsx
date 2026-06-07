"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface ClickableRowProps {
  id: string;
  children: React.ReactNode;
}

export default function ClickableRow({ id, children }: ClickableRowProps) {
  const router = useRouter();

  const handleRowClick = (e: React.MouseEvent) => {
    // Prevent navigating if the user clicked a link (like the linked order)
    const target = e.target as HTMLElement;
    if (target.tagName === "A" || target.closest("a")) {
      return;
    }
    router.push(`/client/tickets/${id}`);
  };

  return (
    <tr 
      className="clickable"
      style={{ cursor: "pointer" }}
      onClick={handleRowClick}
    >
      {children}
    </tr>
  );
}
