import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { ConfirmDialogProvider } from "@/components/ConfirmDialog";

export const metadata: Metadata = {
  title: {
    template: "%s | SUPON Kielce",
    default: "SUPON Kielce — Portal",
  },
  description: "Platforma zarządzania odzieżą roboczą i ŚOI — SUPON Kielce S.A.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ToastProvider>
          <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

