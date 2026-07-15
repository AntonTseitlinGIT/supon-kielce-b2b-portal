"use client";

import { useEffect, useState } from "react";

export function useTheme() {
  const theme = "light";

  useEffect(() => {
    localStorage.removeItem("theme");
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const toggleTheme = () => {
    // dark theme is disabled
  };

  return { theme, toggleTheme };
}
