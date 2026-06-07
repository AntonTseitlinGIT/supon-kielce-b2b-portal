import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  getPageUrl: (page: number) => string;
  itemLabel?: string;
}

function getPageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push("…");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < total - 1) pages.push("…");

  pages.push(total);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  getPageUrl,
  itemLabel = "wyników",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const window = getPageWindow(page, totalPages);

  return (
    <div className="pagination">
      <div style={{ fontSize: 13, color: "var(--muted)" }}>
        Pokazano <strong style={{ color: "var(--text)" }}>{from}–{to}</strong> z{" "}
        <strong style={{ color: "var(--text)" }}>{totalItems}</strong> {itemLabel}
      </div>

      <div className="pagination-controls">
        <Link
          href={getPageUrl(page - 1)}
          className="page-btn"
          aria-label="Poprzednia strona"
          style={{ pointerEvents: page <= 1 ? "none" : "auto", opacity: page <= 1 ? 0.4 : 1 }}
        >
          <ChevronLeft size={16} />
        </Link>

        {window.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="page-btn"
              style={{ pointerEvents: "none", opacity: 0.5, cursor: "default" }}
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={getPageUrl(p)}
              className={`page-btn ${p === page ? "active" : ""}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Link>
          )
        )}

        <Link
          href={getPageUrl(page + 1)}
          className="page-btn"
          aria-label="Następna strona"
          style={{ pointerEvents: page >= totalPages ? "none" : "auto", opacity: page >= totalPages ? 0.4 : 1 }}
        >
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
