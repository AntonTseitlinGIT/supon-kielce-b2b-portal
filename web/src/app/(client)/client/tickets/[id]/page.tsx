import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, MessageCircle, AlertCircle, ShoppingBag, User, Briefcase, FileText } from "lucide-react";
import { formatTicketStatus, formatTicketType, formatDate } from "@/utils/format";
import TicketChat from "./TicketChat";
import CloseTicketButton from "./CloseTicketButton";

type Params = Promise<{ id: string }>;

interface PageProps {
  params: Params;
}

export default async function ClientTicketDetailPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await props.params;
  const { role, clientId, branchId } = session.user;

  // Query database for ticket details and messages
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      branch: { select: { name: true } },
      order: { select: { orderNr: true, id: true } },
      assignedTo: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { name: true, role: true } },
        },
      },
    },
  });

  // Verify access control
  if (!ticket || ticket.clientId !== clientId) {
    notFound();
  }

  if (role === "BRANCH_HEAD" && ticket.branchId !== branchId) {
    redirect("/client/tickets");
  }

  const statusInfo = formatTicketStatus(ticket.status);
  const typeLabel = formatTicketType(ticket.type);

  // Format initial messages list
  const initialMessages = ticket.messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    text: m.text,
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    isFromSupon: m.isFromSupon,
    createdAt: m.createdAt.toISOString(),
    sender: m.sender ? {
      name: m.sender.name,
      role: m.sender.role,
    } : null,
  }));

  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="col-24">
      {/* Breadcrumbs / Header Action */}
      <div className="col-12">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link 
            href="/client/tickets" 
            className="btn btn-secondary btn-sm" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px", 
              height: "36px", 
              padding: "0 16px", 
              borderRadius: "8px",
              boxShadow: "none",
              fontSize: "13px"
            }}
          >
            <ArrowLeft size={16} /> Powrót do zgłoszeń
          </Link>

          {!isClosed && (
            <CloseTicketButton ticketId={ticket.id} />
          )}
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginTop: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "32px", margin: 0, color: "var(--text)" }}>
                Zgłoszenie {ticket.ticketNr}
              </h1>
              <span className={`badge ${statusInfo.className}`} style={{ fontSize: "12px", padding: "2px 10px", height: "auto" }}>
                {statusInfo.label}
              </span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "6px" }}>
              Typ: <strong>{typeLabel}</strong> | Oddział: {ticket.branch.name}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Info Sidebar & Live Chat */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* Left Side: Ticket Parameters */}
        <div className="col-20">
          
          {/* Details Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              Szczegóły sprawy
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "13px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              
              {/* Employee */}
              {ticket.employeeName && (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <User size={18} style={{ color: "var(--muted)", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", display: "block", letterSpacing: "0.05em", marginBottom: "2px" }}>
                      DOTYCZY PRACOWNIKA
                    </span>
                    <strong style={{ color: "var(--text)", fontSize: "14px" }}>{ticket.employeeName}</strong>
                  </div>
                </div>
              )}

              {/* Item */}
              {ticket.itemName && (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <Briefcase size={18} style={{ color: "var(--muted)", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", display: "block", letterSpacing: "0.05em", marginBottom: "2px" }}>
                      DOTYCZY TOWARU
                    </span>
                    <strong style={{ color: "var(--text)", fontSize: "14px" }}>{ticket.itemName}</strong>
                  </div>
                </div>
              )}

              {/* Linked Order */}
              {ticket.order && (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <ShoppingBag size={18} style={{ color: "var(--muted)", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", display: "block", letterSpacing: "0.05em", marginBottom: "2px" }}>
                      ZAMÓWIENIE POWIĄZANE
                    </span>
                    <Link href={`/client/orders/${ticket.orderId}`} style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "underline", fontSize: "14px" }}>
                      {ticket.order.orderNr}
                    </Link>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <AlertCircle size={18} style={{ color: "var(--muted)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", display: "block", letterSpacing: "0.05em", marginBottom: "2px" }}>
                    DATA UTWORZENIA
                  </span>
                  <span style={{ color: "var(--text)", fontSize: "14px", fontWeight: 500 }}>{formatDate(ticket.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Manager Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "24px" }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              Opiekun zgłoszenia
            </h3>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
              {ticket.assignedTo ? (
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "13px"
                  }}>
                    {ticket.assignedTo.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{ticket.assignedTo.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ticket.assignedTo.email}</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "10px", color: "var(--muted)", fontSize: "13px", alignItems: "center" }}>
                  <User size={18} />
                  <span>Oczekiwanie na przydział menedżera SUPON...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Live Chat board */}
        <TicketChat
          ticketId={ticket.id}
          initialMessages={initialMessages}
          currentUserId={session.user.id}
          ticketStatus={ticket.status}
        />

      </div>
    </div>
  );
}
