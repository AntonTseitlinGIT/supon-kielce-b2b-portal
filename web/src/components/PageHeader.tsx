interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * compact=true — client portal style: no border, no negative margin bleed.
   * Default (false) — admin portal style: full-bleed border-bottom header.
   */
  compact?: boolean;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, compact = false, children }: PageHeaderProps) {
  if (compact) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", padding: "0 0 10px 0" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "28px", margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ color: "var(--muted)", fontSize: "14px", margin: "5px 0 0 0" }}>{subtitle}</p>}
        </div>
        {children && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <header style={{
      borderBottom: "1px solid var(--line)",
      background: "transparent",
      margin: "0 -24px 24px -24px",
      padding: "20px 24px",
    }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: 800, margin: 0, lineHeight: 1.15 }}>{title}</h1>
          {subtitle && (
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "5px 0 0 0", lineHeight: 1.4 }}>{subtitle}</p>
          )}
        </div>
        {children && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
