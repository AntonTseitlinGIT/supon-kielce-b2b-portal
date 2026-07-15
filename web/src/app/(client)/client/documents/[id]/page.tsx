import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, FileText, Truck, Calendar, Hash, Download } from "lucide-react";
import { formatShortDate } from "@/utils/format";
import PrintButton from "@/components/PrintButton";

type Params = Promise<{ id: string }>;

interface PageProps {
  params: Params;
}

export default async function ClientWzDetailPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await props.params;

  // Query WZ Document details
  const doc = await prisma.wzDocument.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          client: true,
          branch: true,
        },
      },
      items: true,
    },
  });

  // Verify access control
  if (!doc || doc.clientId !== session.user.clientId) {
    notFound();
  }

  if (session.user.role === "BRANCH_HEAD" && doc.branchId !== session.user.branchId) {
    redirect("/client/documents");
  }

  const client = doc.order.client;
  const branch = doc.order.branch;

  return (
    <div className="col-24">
      {/* Back button & Breadcrumbs */}
      <div id="back-btn-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link 
          href="/client/documents" 
          className="btn btn-ghost btn-sm" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px",
            background: "transparent",
            color: "var(--muted)",
            boxShadow: "none",
            borderColor: "transparent"
          }}
        >
          <ArrowLeft size={15} /> Powrót do dokumentów WZ
        </Link>
      </div>

      {/* Print styles override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 12px !important;
          }
          .sidebar, 
          .page-header, 
          #back-btn-container,
          footer {
            display: none !important;
          }
          .portal-main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .page-content {
            padding: 0 !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .table-wrapper {
            border: 1px solid #000 !important;
            border-radius: 0 !important;
          }
          table.table th {
            background: #eee !important;
            color: #000 !important;
            border-bottom: 1px solid #000 !important;
          }
          table.table td {
            border-top: 1px solid #000 !important;
          }
        }
      `}} />

      {/* Invoice/WZ Card Box */}
      <div className="card" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "32px", background: "#fff" }}>
        
        {/* Document Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid var(--text)", paddingBottom: "20px" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "28px", margin: 0, textTransform: "uppercase" }}>
              Dokument WZ
            </h2>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--muted)", marginTop: "4px" }}>
              Numer: {doc.wzNr}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "14px" }}>
            <div>Miejscowość: <strong>Kielce</strong></div>
            <div>Data wystawienia: <strong>{formatShortDate(doc.date)}</strong></div>
            <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--muted)" }}>
              Dotyczy zamówienia: {doc.order.orderNr}
            </div>
          </div>
        </div>

        {/* Contractor Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          {/* Issuer / Seller */}
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "20px", background: "var(--section-bg)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
              Wystawca / Dostawca
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>SUPON Kielce S.A.</div>
            <div style={{ fontSize: "14px", color: "var(--muted)", marginTop: "6px", lineHeight: "1.5" }}>
              ul. Sandomierska 105<br />
              25-324 Kielce<br />
              Polska
            </div>
            <div style={{ fontSize: "13px", marginTop: "10px" }}>
              NIP: <strong>9590832145</strong>
            </div>
          </div>

          {/* Recipient / Client */}
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
              Odbiorca
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{client.name}</div>
            <div style={{ fontSize: "14px", color: "var(--muted)", marginTop: "6px", lineHeight: "1.5" }}>
              <strong>Oddział: {branch.name}</strong><br />
              {branch.address}
            </div>
            {client.nip && (
              <div style={{ fontSize: "13px", marginTop: "10px" }}>
                NIP: <strong>{client.nip}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Logistics parameters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "16px", background: "var(--page-bg)", fontSize: "13px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Truck size={16} style={{ color: "var(--muted)" }} />
            <div>Przewoźnik: <strong>{doc.carrier}</strong></div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Hash size={16} style={{ color: "var(--muted)" }} />
            <div>List przewozowy: <strong style={{ fontFamily: "monospace" }}>{doc.trackingNr}</strong></div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Calendar size={16} style={{ color: "var(--muted)" }} />
            <div>Odbiorca paczki: <strong>{doc.recipient}</strong></div>
          </div>
        </div>

        {/* WZ Items Table */}
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
            Pozycje wydania
          </h3>
          <div className="table-wrapper">
            <table className="table">
              <thead style={{ background: "var(--section-bg)" }}>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>Lp.</th>
                  <th>Numer artykułu</th>
                  <th>Nazwa towaru / Opis</th>
                  <th>Rozmiar</th>
                  <th style={{ width: "80px", textAlign: "center" }}>Ilość</th>
                  <th style={{ width: "60px", textAlign: "center" }}>J.m.</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: "center", color: "var(--muted)" }}>{index + 1}</td>
                    <td style={{ fontFamily: "monospace", fontWeight: 500 }}>{item.articleNr}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><span className="badge badge-neutral" style={{ fontWeight: 600 }}>{item.size}</span></td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{item.qty}</td>
                    <td style={{ textAlign: "center", color: "var(--muted)" }}>szt.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* WZ Download Box */}
        <div style={{ 
          marginTop: "40px", 
          borderTop: "1px dashed var(--line)", 
          paddingTop: "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{
            width: "100%",
            background: "var(--section-bg)",
            borderRadius: "16px",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            border: "1px solid var(--line)"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "var(--accent-light)",
              color: "var(--accent)",
              display: "grid",
              placeItems: "center",
              marginBottom: "16px"
            }}>
              <FileText size={28} />
            </div>
            
            <h3 style={{ 
              fontFamily: "var(--font-heading)", 
              fontWeight: 800, 
              fontSize: "20px", 
              margin: "0 0 8px 0",
              color: "var(--text)"
            }}>
              Dokument WZ gotowy do pobrania
            </h3>
            
            <p style={{ 
              color: "var(--muted)", 
              fontSize: "14px", 
              margin: "0 0 24px 0", 
              maxWidth: "500px",
              lineHeight: "1.5"
            }}>
              Oficjalny dokument Wydania Zewnętrznego (PDF) wygenerowany bezpośrednio z systemu firmy.
            </p>

            <a 
              href={doc.pdfUrl || `/api/client/reports/pdf?orderId=${doc.orderId}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ 
                height: "46px", 
                padding: "0 28px", 
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 8px 16px color-mix(in oklab, var(--accent) 25%, transparent)",
                background: "var(--accent)",
                color: "#fff"
              }}
            >
              <Download size={16} /> Pobierz dokument WZ (PDF)
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
