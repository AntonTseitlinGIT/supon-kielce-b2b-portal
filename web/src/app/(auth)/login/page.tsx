import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Logowanie",
};

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.loginContainer}>
        <main className={styles.loginCard} aria-label="Ekran logowania">
          <section className={styles.loginLeft} aria-label="Formularz logowania">
            <h2>Panel Klienta</h2>
            <p>Zaloguj się, aby zarządzać swoimi zamówieniami</p>
            <Suspense fallback={<div style={{ height: 200 }} />}>
              <LoginForm />
            </Suspense>
          </section>
          
          <aside className={styles.loginRight} aria-label="Informacje o platformie">
            <div className={styles.brandTile}>
              <img src="/logo.png" alt="Logo SUPON" className={styles.logoImage} />
              <div>
                <div className={styles.brandNameText}>SUPON KIELCE</div>
                <div className={styles.tagText}>Platforma Obsługi Klienta</div>
              </div>
            </div>
            <div className={styles.roleBadgeText}>PORTAL KLIENTA</div>
          </aside>
        </main>
      </div>
    </div>
  );
}
