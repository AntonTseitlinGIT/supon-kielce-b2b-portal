"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { sendTicketMessage } from "./actions";
import { Paperclip, Send, FileText, Download, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/format";

interface ChatMessage {
  id: string;
  senderId: string;
  text: string | null;
  fileUrl: string | null;
  fileName: string | null;
  isFromSupon: boolean;
  createdAt: Date | string;
  sender?: {
    name: string;
    role: string;
  } | null;
}

interface TicketChatProps {
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
          href={`/client/orders/by-nr/${part}`} 
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
};

export default function TicketChat({
  ticketId,
  initialMessages,
  currentUserId,
  ticketStatus,
}: TicketChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  
  // File upload states
  const [uploading, setUploading] = useState(false);
  const [attachedUrl, setAttachedUrl] = useState("");
  const [attachedName, setAttachedName] = useState("");

  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isClosed = ticketStatus === "CLOSED";

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up Supabase Realtime Subscription
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`ticket_messages_${ticketId}`)
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
          
          // Check if message is already in our list (to prevent duplication of sent messages)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            
            // Format message object
            const formatted: ChatMessage = {
              id: newMsg.id,
              senderId: newMsg.senderId,
              text: newMsg.text,
              fileUrl: newMsg.fileUrl,
              fileName: newMsg.fileName,
              isFromSupon: newMsg.isFromSupon,
              createdAt: newMsg.createdAt,
              sender: newMsg.isFromSupon 
                ? { name: "Menedżer SUPON", role: "SUPON_MANAGER" }
                : { name: "Ty", role: "BRANCH_HEAD" },
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

  // Attach a file
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

      const { data, error } = await supabase.storage
        .from("ticket-attachments")
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("ticket-attachments")
        .getPublicUrl(filePath);

      setAttachedUrl(publicUrl);
      setAttachedName(file.name);
    } catch (error) {
      console.error("Error uploading chat attachment:", error);
      alert("Nie udało się załączyć pliku. Spróbuj ponownie.");
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

    // Reset inputs immediately (optimistic feel)
    setInputText("");
    setAttachedUrl("");
    setAttachedName("");

    startTransition(async () => {
      const res = await sendTicketMessage({
        ticketId,
        text: messageText,
        fileUrl: fUrl || undefined,
        fileName: fName || undefined,
      });

      if (!res.success || !res.message) {
        alert(res.error || "Nie udało się wysłać wiadomości.");
        // Restore input if error
        setInputText(messageText);
        setAttachedUrl(fUrl);
        setAttachedName(fName);
      } else {
        const newMsg = res.message;
        // Append message to UI list if it wasn't added by Subscription
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg as any];
        });
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "550px", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--surface)" }}>
      
      {/* Header bar */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isClosed ? "var(--text-muted)" : "var(--success)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px" }}>
            {isClosed ? "Zgłoszenie Zamknięte" : "Konwersacja online (Real-time)"}
          </span>
        </div>
      </div>

      {/* Message Feed Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", background: "var(--page-bg)" }}>
        
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto" }}>
            Brak wiadomości. Rozpocznij czat.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            
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
                  {/* Sender Name */}
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", padding: "0 4px" }}>
                    {isMe ? "Ty" : msg.sender?.name || "Menedżer SUPON"}
                  </span>
                  
                  {/* Bubble */}
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius)",
                    background: isMe ? "var(--accent)" : "var(--surface)",
                    color: isMe ? "#fff" : "var(--text-primary)",
                    boxShadow: "var(--shadow-xs)",
                    border: isMe ? "none" : "1px solid var(--line)",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    wordBreak: "break-word"
                  }}>
                    {/* Text */}
                    {msg.text && <p style={{ margin: 0 }}>{renderTextWithLinks(msg.text)}</p>}
                    
                    {/* File Attachment */}
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
                          background: isMe ? "rgba(255,255,255,0.15)" : "var(--surface-2)",
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
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", padding: "0 4px" }}>
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div style={{ borderTop: "1px solid var(--line)", padding: "14px 20px", background: "var(--surface)" }}>
        {isClosed ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "14px", padding: "10px 0" }}>
            Zgłoszenie zostało zamknięte. Czat jest wyłączony.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            {/* Attachment Preview */}
            {attachedName && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--surface-2)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: "12px", border: "1px solid var(--line)" }}>
                <FileText size={14} style={{ color: "var(--accent)" }} />
                <span>Załączono plik: <strong>{attachedName}</strong></span>
                <button 
                  type="button" 
                  onClick={() => { setAttachedUrl(""); setAttachedName(""); }}
                  style={{ marginLeft: "auto", border: "none", background: "transparent", color: "var(--danger)", cursor: "pointer", fontWeight: 700 }}
                >
                  Usuń
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* Attachment Picker */}
              <label 
                className="btn btn-secondary btn-icon" 
                style={{ 
                  cursor: "pointer", 
                  height: "40px", 
                  width: "40px", 
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

              {/* Text Input */}
              <input
                type="text"
                className="form-input"
                style={{ height: "40px", flex: 1 }}
                placeholder="Wpisz treść wiadomości..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isPending}
              />

              {/* Send Button */}
              <button
                type="submit"
                className="btn btn-primary btn-icon"
                style={{ height: "40px", width: "40px", padding: 0 }}
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
