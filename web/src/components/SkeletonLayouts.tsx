/** Reusable skeleton layouts for loading.tsx files across both portals. */

function Sk({ w = "100%", h = 14, className = "skeleton-text", style = {} }: {
  w?: string | number;
  h?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: w, height: h, ...style }}
    />
  );
}

// ── KPI row (4 cards) ─────────────────────────────────────────────────────────
export function KpiRowSkeleton() {
  return (
    <div className="stats-summary" style={{ marginBottom: 24 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="kpi" style={{ display: "flex", flexDirection: "column", gap: 12, pointerEvents: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Sk w={120} h={12} className="skeleton skeleton-text" />
            <Sk w={36} h={36} className="skeleton skeleton-avatar" style={{ borderRadius: 10 }} />
          </div>
          <Sk w={60} h={32} className="skeleton skeleton-title" />
          <Sk w={160} h={11} className="skeleton skeleton-text" />
        </div>
      ))}
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────
export function PageHeaderSkeleton({ hasButton = true }: { hasButton?: boolean }) {
  return (
    <header
      className="page-header"
      style={{ borderBottom: "1px solid var(--line)", margin: "0 -24px 24px -24px", padding: 24 }}
    >
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Sk w={260} h={36} className="skeleton skeleton-h1" />
          <Sk w={340} h={13} className="skeleton skeleton-text" />
        </div>
        {hasButton && <Sk w={140} h={36} className="skeleton skeleton-btn" />}
      </div>
    </header>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────
export function FilterBarSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Sk key={i} w={160} h={36} className="skeleton skeleton-btn" />
      ))}
    </div>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card">
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <Sk w="80%" h={12} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    <Sk w={c === 0 ? "70%" : c === cols - 1 ? "50%" : "85%"} h={13} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Detail page: main + sidebar grid ─────────────────────────────────────────
export function DetailSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
      {/* Main column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="card">
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <Sk w={180} h={18} className="skeleton skeleton-text" />
          </div>
          <div className="card-content" style={{ padding: 0 }}>
            <TableSkeleton rows={5} cols={5} />
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <Sk w={160} h={18} className="skeleton skeleton-text" />
          </div>
          <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ padding: 16, border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
                <Sk w="60%" h={14} style={{ marginBottom: 8 }} />
                <Sk w="90%" h={12} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <Sk w={140} h={16} className="skeleton skeleton-text" />
            </div>
            <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2, 3].map((j) => (
                <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Sk w={36} h={36} className="skeleton" style={{ borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Sk w="50%" h={11} />
                    <Sk w="80%" h={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chat / ticket thread ──────────────────────────────────────────────────────
export function ChatSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        <div className="card" style={{ minHeight: 400 }}>
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <Sk w={140} h={16} />
          </div>
          <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: i % 2 === 0 ? "row-reverse" : "row" }}>
                <Sk w={32} h={32} className="skeleton skeleton-avatar" />
                <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: 6 }}>
                  <Sk w={80} h={11} />
                  <Sk w={i % 2 === 0 ? 200 : 260} h={40} style={{ borderRadius: 12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2].map((i) => (
            <div key={i} className="card">
              <div className="card-header" style={{ padding: "14px 16px" }}>
                <Sk w={120} h={14} />
              </div>
              <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Sk w="100%" h={12} />
                <Sk w="80%" h={12} />
                <Sk w="90%" h={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard charts area ─────────────────────────────────────────────────────
export function ChartAreaSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
      {[1, 2].map((i) => (
        <div key={i} className="card">
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <Sk w={180} h={16} />
          </div>
          <div className="card-content">
            <Sk w="100%" h={200} style={{ borderRadius: "var(--radius)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Form skeleton ─────────────────────────────────────────────────────────────
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="card">
      <div className="card-header" style={{ padding: "16px 20px" }}>
        <Sk w={200} h={18} />
      </div>
      <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Sk w={120} h={12} />
            <Sk w="100%" h={38} style={{ borderRadius: "var(--radius-sm)" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
          <Sk w={140} h={40} className="skeleton skeleton-btn" />
          <Sk w={100} h={40} className="skeleton skeleton-btn" />
        </div>
      </div>
    </div>
  );
}

// ── Personnel / employee cards ────────────────────────────────────────────────
export function PersonnelTableSkeleton() {
  return (
    <div className="card">
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {["Pracownik", "Stanowisko", "Oddział", "Status", "RFID", ""].map((_, i) => (
                <th key={i}><Sk w="70%" h={12} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, r) => (
              <tr key={r}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Sk w={36} h={36} className="skeleton skeleton-avatar" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <Sk w={120} h={13} />
                      <Sk w={70} h={11} />
                    </div>
                  </div>
                </td>
                <td><Sk w={100} h={13} /></td>
                <td><Sk w={90} h={13} /></td>
                <td><Sk w={72} h={22} className="skeleton skeleton-badge" /></td>
                <td><Sk w={40} h={13} /></td>
                <td><Sk w={60} h={28} className="skeleton skeleton-btn" style={{ width: 60, height: 28 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
