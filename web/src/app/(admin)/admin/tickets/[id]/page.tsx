import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, User, Building, Calendar, ShoppingBag, FileText, Briefcase, Eye } from "lucide-react";
import { formatTicketStatus, formatTicketType, formatDate } from "@/utils/format";
import AdminTicketChat from "./AdminTicketChat";
import TicketStatusController from "./TicketStatusController";
import ApproveTicketButton from "./ApproveTicketButton";

type Params = Promise<{ id: string }>;

interface PageProps {
  params: Params;
}

export default async function AdminTicketDetailPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;
  if (role !== "SUPON_MANAGER" && role !== "SUPON_ADMIN") {
    redirect("/client/dashboard");
  }

  const { id } = await props.params;

  // Fetch ticket with messages and internal notes
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      client: true,
      branch: true,
      product: true,
      order: { select: { id: true, orderNr: true } },
      messages: {
        include: {
          sender: { select: { name: true, role: true } }
        }
      },
      internalNotes: {
        include: {
          author: { select: { name: true, role: true } }
        }
      }
    }
  });

  if (!ticket) {
    notFound();
  }

  // Combine public messages and internal notes, sort by date
  const combinedMessages = [
    ...ticket.messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      text: m.text,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      isFromSupon: m.isFromSupon,
      isInternal: false,
      createdAt: m.createdAt,
      sender: m.sender ? { name: m.sender.name, role: m.sender.role } : null
    })),
    ...ticket.internalNotes.map(n => ({
      id: n.id,
      senderId: n.authorId,
      text: n.text,
      fileUrl: null,
      fileName: null,
      isFromSupon: true,
      isInternal: true,
      createdAt: n.createdAt,
      sender: n.author ? { name: n.author.name, role: n.author.role } : null
    }))
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const statusInfo = formatTicketStatus(ticket.status);
  const typeLabel = formatTicketType(ticket.type);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>
      {/* Back button and title */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link 
            href="/admin/tickets" 
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
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>
              Typ: <strong>{typeLabel}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Info Sidebar & Live Chat */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* Left Side: Actions and Details Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Status Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              Status sprawy
            </h3>
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <TicketStatusController
                ticketId={ticket.id}
                initialStatus={ticket.status}
              />
            </div>
          </div>

          {/* Approval Action Card */}
          {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (ticket.type === "EXCHANGE" || ticket.type === "COMPLAINT") && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px", border: "1px solid var(--accent-light)" }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--accent)" }}>
                Akcja menedżera
              </h3>
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                <ApproveTicketButton
                  ticketId={ticket.id}
                  ticketType={ticket.type}
                  itemName={ticket.itemName || ticket.product?.name || "Nieznany artykuł"}
                  size={ticket.size || undefined}
                  newSize={ticket.newSize || undefined}
                />
              </div>
            </div>
          )}

          {/* Details Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              Szczegóły zgłoszenia
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "13px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              
              {/* Client */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0
                }}>
                  <Building size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1, wordBreak: "break-word" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", display: "block", letterSpacing: "0.05em", marginBottom: "2px" }}>
                    KLIENT / FIRMA
                  </span>
                  <strong style={{ color: "var(--text)", fontSize: "14px" }}>{ticket.client.name}</strong>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>NIP: {ticket.client.nip}</div>
                </div>
              </div>

              {/* Branch */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0
                }}>
                  <Building size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1, wordBreak: "break-word" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", display: "block", letterSpacing: "0.05em", marginBottom: "2px" }}>
                    ODDZIAŁ
                  </span>
                  <strong style={{ color: "var(--text)", fontSize: "14px" }}>{ticket.branch.name}</strong>
                </div>
              </div>

              {/* Employee */}
              {ticket.employeeName && (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0
                  }}>
                    <User size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1, wordBreak: "break-word" }}>
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
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0
                  }}>
                    <Briefcase size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1, wordBreak: "break-word" }}>
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
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0
                  }}>
                    <ShoppingBag size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1, wordBreak: "break-word" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", display: "block", letterSpacing: "0.05em", marginBottom: "2px" }}>
                      ZAMÓWIENIE POWIĄZANE
                    </span>
                    <Link href={`/admin/orders/${ticket.orderId}`} style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "underline", fontSize: "14px" }}>
                      {ticket.order.orderNr}
                    </Link>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0
                }}>
                  <Calendar size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1, wordBreak: "break-word" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", display: "block", letterSpacing: "0.05em", marginBottom: "2px" }}>
                    DATA UTWORZENIA
                  </span>
                  <span style={{ color: "var(--text)", fontSize: "14px", fontWeight: 500 }}>{formatDate(ticket.createdAt)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Side: Chat Feed */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <AdminTicketChat
            ticketId={ticket.id}
            initialMessages={combinedMessages}
            currentUserId={session.user.id}
            ticketStatus={ticket.status}
          />
        </div>

      </div>
    </div>
  );
}
