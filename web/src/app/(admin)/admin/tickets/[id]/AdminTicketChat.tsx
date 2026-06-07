"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { sendAdminTicketMessage } from "./actions";
import { Paperclip, Send, FileText, Download, Loader2, EyeOff, MessageSquare } from "lucide-react";
import { formatDate } from "@/utils/format";

interface ChatMessage {
  id: string;
  senderId: string;
  text: string | null;
  fileUrl: string | null;
  fileName: string | null;
  isFromSupon: boolean;
  isInternal: boolean;
  createdAt: Date | string;
  sender?: {
    name: string;
    role: string;
  } | null;
}

interface AdminTicketChatProps {
  ticketId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
  ticketStatus: string;
}

const renderTextWithLinks = (text: string | null) => {
  if (!text) return null;
  const regex = /((?:WYM|REK|Z)-\d{4}-\d+)/g;
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <a 
          key={index} 
          href={`/admin/orders/by-nr/${part}`} 
          style={{ 
            color: "inherit", 
            textDecoration: "underline", 
            fontWeight: "bold" 
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function AdminTicketChat({
  ticketId,
  initialMessages,
  currentUserId,
  ticketStatus,
}: AdminTicketChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  
  // Message Type toggle: false = message to client, true = internal note
  const [isInternal, setIsInternal] = useState(false);

  // File upload states (only for public messages)
  const [uploading, setUploading] = useState(false);
  const [attachedUrl, setAttachedUrl] = useState("");
  const [attachedName, setAttachedName] = useState("");

  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isClosed = ticketStatus === "CLOSED";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up Realtime subscriptions for both messages and internal notes
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`admin_ticket_${ticketId}`)
      // Public messages
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "TicketMessage",
          filter: `ticketId=eq.${ticketId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            
            const formatted: ChatMessage = {
              id: newMsg.id,
              senderId: newMsg.senderId,
              text: newMsg.text,
              fileUrl: newMsg.fileUrl,
              fileName: newMsg.fileName,
              isFromSupon: newMsg.isFromSupon,
              isInternal: false,
              createdAt: newMsg.createdAt,
              sender: newMsg.isFromSupon
                ? { name: "Menedżer SUPON", role: "SUPON_MANAGER" }
                : { name: "Klient", role: "BRANCH_HEAD" },
            };
            return [...prev, formatted];
          });
        }
      )
      // Internal notes
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "InternalNote",
          filter: `ticketId=eq.${ticketId}`,
        },
        async (payload) => {
          const newNote = payload.new as any;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newNote.id)) return prev;
            
            const formatted: ChatMessage = {
              id: newNote.id,
              senderId: newNote.authorId,
              text: newNote.text,
              fileUrl: null,
              fileName: null,
              isFromSupon: true,
              isInternal: true,
              createdAt: newNote.createdAt,
              sender: { name: "Menedżer SUPON", role: "SUPON_MANAGER" },
            };
            return [...prev, formatted];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const nameOnly = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "");
      const newFileName = `${Date.now()}-${nameOnly}.${fileExt}`;
      const filePath = `tickets/${newFileName}`;

      const { error } = await supabase.storage
        .from("ticket-attachments")
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("ticket-attachments")
        .getPublicUrl(filePath);

      setAttachedUrl(publicUrl);
      setAttachedName(file.name);
    } catch (error) {
      console.error("Error uploading attachment:", error);
      alert("Błąd przy wgrywaniu załącznika. Spróbuj ponownie.");
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedUrl) return;

    const messageText = inputText;
    const fUrl = attachedUrl;
    const fName = attachedName;
    const mode = isInternal;

    setInputText("");
    setAttachedUrl("");
    setAttachedName("");

    startTransition(async () => {
      const res = await sendAdminTicketMessage({
        ticketId,
        text: messageText,
        fileUrl: mode ? undefined : (fUrl || undefined),
        fileName: mode ? undefined : (fName || undefined),
        isInternal: mode,
      });

      if (!res.success || !res.message) {
        alert(res.error || "Wystąpił błąd podczas wysyłania.");
        setInputText(messageText);
        if (!mode) {
          setAttachedUrl(fUrl);
          setAttachedName(fName);
        }
      } else {
        const newMsg = res.message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg as any];
        });
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "550px", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--page-bg)", boxShadow: "var(--shadow-sm)" }}>
      
      {/* Header bar */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "var(--section-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isClosed ? "var(--muted)" : "var(--ok)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px" }}>
            {isClosed ? "Zgłoszenie Zamknięte" : "Wiadomości real-time"}
          </span>
        </div>
      </div>

      {/* Messages feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", background: "var(--bg)" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--muted)", margin: "auto" }}>
            Brak historii konwersacji.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId && !msg.isInternal;
            
            // Layout for internal team note
            if (msg.isInternal) {
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                  <div style={{
                    width: "100%",
                    maxWidth: "85%",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "color-mix(in oklab, var(--warn) 8%, var(--page-bg))",
                    border: "1px dashed color-mix(in oklab, var(--warn) 40%, transparent)",
                    fontSize: "13.5px",
                    boxShadow: "var(--shadow-xs)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--warn)", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>
                      <EyeOff size={12} /> Notatka wewnętrzna (widoczna tylko dla SUPON)
                    </div>
                    <p style={{ margin: 0, color: "var(--text)", lineHeight: 1.4 }}>{renderTextWithLinks(msg.text)}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", color: "var(--muted)" }}>
                      <span>Autor: {msg.sender?.name || "Menedżer"}</span>
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                style={{ 
                  display: "flex", 
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  width: "100%" 
                }}
              >
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: isMe ? "flex-end" : "flex-start",
                  maxWidth: "75%"
                }}>
                  {/* Sender title */}
                  <span style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px", padding: "0 4px" }}>
                    {isMe ? "Ty (SUPON)" : `${msg.sender?.name || "Klient"} (${msg.isFromSupon ? "SUPON" : "Klient"})`}
                  </span>
                  
                  {/* Bubble */}
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius)",
                    background: isMe ? "var(--accent)" : "var(--page-bg)",
                    color: isMe ? "#fff" : "var(--text)",
                    boxShadow: "var(--shadow-xs)",
                    border: isMe ? "none" : "1px solid var(--line)",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    wordBreak: "break-word"
                  }}>
                    {msg.text && <p style={{ margin: 0 }}>{renderTextWithLinks(msg.text)}</p>}
                    
                    {msg.fileUrl && (
                      <a 
                        href={msg.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          marginTop: msg.text ? "8px" : "0",
                          padding: "6px 10px",
                          borderRadius: "var(--radius-sm)",
                          background: isMe ? "rgba(255,255,255,0.15)" : "var(--section-bg)",
                          color: isMe ? "#fff" : "var(--accent-text)",
                          textDecoration: "none",
                          fontSize: "12px",
                          fontWeight: 500
                        }}
                      >
                        <FileText size={14} />
                        <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {msg.fileName || "Załącznik"}
                        </span>
                        <Download size={12} style={{ marginLeft: "auto" }} />
                      </a>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <span style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px", padding: "0 4px" }}>
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div style={{ borderTop: "1px solid var(--line)", padding: "14px 20px", background: "var(--section-bg)" }}>
        {isClosed ? (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "14px", padding: "10px 0" }}>
            Zgłoszenie zostało zamknięte. Chat jest wyłączony.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            {/* Toggle Sending Mode (Client message vs. Internal Note) */}
            <div style={{ display: "flex", gap: "12px", fontSize: "12.5px", fontWeight: 600, paddingBottom: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: !isInternal ? "var(--accent)" : "var(--muted)" }}>
                <input 
                  type="radio" 
                  checked={!isInternal} 
                  onChange={() => setIsInternal(false)} 
                  style={{ accentColor: "var(--accent)" }} 
                />
                Wiadomość do klienta
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: isInternal ? "var(--warn)" : "var(--muted)" }}>
                <input 
                  type="radio" 
                  checked={isInternal} 
                  onChange={() => setIsInternal(true)} 
                  style={{ accentColor: "var(--warn)" }} 
                />
                Notatka wewnętrzna
              </label>
            </div>

            {/* Attachment preview (Only if public message) */}
            {!isInternal && attachedName && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--page-bg)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: "12px", border: "1px solid var(--line)" }}>
                <FileText size={14} style={{ color: "var(--accent)" }} />
                <span>Załączono plik: <strong>{attachedName}</strong></span>
                <button 
                  type="button" 
                  onClick={() => { setAttachedUrl(""); setAttachedName(""); }}
                  style={{ marginLeft: "auto", border: "none", background: "transparent", color: "var(--err)", cursor: "pointer", fontWeight: 700 }}
                >
                  Usuń
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* Attachment trigger (Only for public messages) */}
              {!isInternal && (
                <label 
                  className="btn btn-secondary btn-icon" 
                  style={{ 
                    cursor: "pointer", 
                    height: "44px", 
                    width: "44px", 
                    padding: 0,
                    display: "grid", 
                    placeItems: "center" 
                  }}
                  title="Dodaj załącznik"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Paperclip size={18} />
                  )}
                  <input 
                    type="file" 
                    onChange={handleAttachment} 
                    disabled={uploading || isPending}
                    style={{ display: "none" }} 
                  />
                </label>
              )}

              {/* Message text field */}
              <input
                type="text"
                className="form-input"
                style={{ 
                  height: "44px", 
                  flex: 1, 
                  marginTop: 0,
                  borderColor: isInternal ? "color-mix(in oklab, var(--warn) 50%, var(--line))" : "var(--line)",
                  boxShadow: isInternal ? "0 0 0 3px color-mix(in oklab, var(--warn) 8%, transparent)" : "none"
                }}
                placeholder={isInternal ? "Wpisz treść notatki wewnętrznej (widocznej tylko dla zespołu)..." : "Wpisz treść wiadomości do klienta..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isPending}
              />

              {/* Submit button */}
              <button
                type="submit"
                className={`btn btn-icon ${isInternal ? "" : "btn-primary"}`}
                style={{ 
                  height: "44px", 
                  width: "44px", 
                  padding: 0,
                  background: isInternal ? "var(--warn)" : undefined,
                  color: isInternal ? "#fff" : undefined,
                  border: isInternal ? "1px solid var(--warn)" : undefined
                }}
                disabled={isPending || uploading || (!inputText.trim() && !attachedUrl)}
                title="Wyślij"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
