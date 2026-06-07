import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { formatShortDate } from "@/utils/format";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  searchParams: SearchParams;
}

export default async function ClientDocumentsPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;

  const search = (searchParams.search as string) || "";
  const page = parseInt((searchParams.page as string) || "1", 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  const { role, clientId, branchId } = session.user;

  // 1. Where filters
  const where: any = {
    clientId: clientId!,
  };

  if (role === "BRANCH_HEAD") {
    where.branchId = branchId!;
  }

  if (search) {
    where.OR = [
      { wzNr: { contains: search, mode: "insensitive" } },
      { order: { orderNr: { contains: search, mode: "insensitive" } } },
      { recipient: { contains: search, mode: "insensitive" } },
    ];
  }

  // 2. Query DB
  const [documents, totalDocs] = await Promise.all([
    prisma.wzDocument.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        order: {
          select: {
            orderNr: true,
            id: true,
            branch: { select: { name: true } },
          },
        },
        items: { select: { qty: true } },
      },
    }),
    prisma.wzDocument.count({ where }),
  ]);

  const totalPages = Math.ceil(totalDocs / limit) || 1;

  // Helper: Pagination link
  const getPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <div className="page-header" style={{ position: "static", background: "transparent", borderBottom: "none", padding: "0 0 10px 0", minHeight: "auto" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "28px", color: "var(--text-primary)" }}>
            Dokumenty WZ
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Pobieraj i przeglądaj dokumenty wydania zewnętrznego (WZ) dla zrealizowanych dostaw
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: "16px", border: "1px solid var(--line)" }}>
        <form method="GET" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="text"
              name="search"
              placeholder="Szukaj po numerze WZ, zamówieniu lub odbiorcy..."
              defaultValue={search}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ height: "48px", borderRadius: "14px" }}>
            Filtruj
          </button>
          {search && (
            <Link href="/client/documents" className="btn btn-ghost" style={{ fontSize: "14px", height: "48px", borderRadius: "14px" }}>
              Wyczyść
            </Link>
          )}
        </form>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--line)" }}>
        {documents.length === 0 ? (
          <div className="empty-state">
            <FileText />
            <h3>Brak dokumentów</h3>
            <p>Nie odnaleziono żadnych dokumentów WZ.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Numer WZ</th>
                    <th>Data dokumentu</th>
                    <th>Zamówienie</th>
                    {role === "CLIENT_HEAD" && <th>Oddział</th>}
                    <th>Odbiorca</th>
                    <th>Pozycje</th>
                    <th>Kurier</th>
                    <th>Numer śledzenia</th>
                    <th>Status</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const totalQty = doc.items.reduce((acc, curr) => acc + curr.qty, 0);

                    return (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 600 }}>
                          <Link href={`/client/documents/${doc.id}`} style={{ color: "var(--accent)" }}>
                            {doc.wzNr}
                          </Link>
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {formatShortDate(doc.date)}
                        </td>
                        <td>
                          <Link href={`/client/orders/${doc.orderId}`} style={{ fontWeight: 500, textDecoration: "underline" }}>
                            {doc.order.orderNr}
                          </Link>
                        </td>
                        {role === "CLIENT_HEAD" && (
                          <td style={{ color: "var(--text-secondary)" }}>
                            {doc.order.branch.name}
                          </td>
                        )}
                        <td>{doc.recipient}</td>
                        <td>{totalQty} szt.</td>
                        <td>{doc.carrier}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{doc.trackingNr}</td>
                        <td>
                          <span className={`badge ${doc.status === "RECEIVED" ? "badge-success" : "badge-warning"}`}>
                            {doc.status === "RECEIVED" ? "Odebrano" : "W drodze"}
                          </span>
                        </td>
                        <td>
                          <Link href={`/client/documents/${doc.id}`} className="btn btn-secondary btn-sm" style={{ display: "inline-flex", gap: "6px" }}>
                            <Eye size={14} /> Szczegóły
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <div>
                  Pokazano <strong>{skip + 1}</strong>–<strong>{Math.min(skip + limit, totalDocs)}</strong> z <strong>{totalDocs}</strong> dokumentów WZ
                </div>
                <div className="pagination-controls">
                  <Link
                    href={getPageUrl(page - 1)}
                    className="page-btn"
                    style={{ pointerEvents: page <= 1 ? "none" : "auto", opacity: page <= 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={16} />
                  </Link>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={getPageUrl(p)}
                      className={`page-btn ${p === page ? "active" : ""}`}
                    >
                      {p}
                    </Link>
                  ))}

                  <Link
                    href={getPageUrl(page + 1)}
                    className="page-btn"
                    style={{ pointerEvents: page >= totalPages ? "none" : "auto", opacity: page >= totalPages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
