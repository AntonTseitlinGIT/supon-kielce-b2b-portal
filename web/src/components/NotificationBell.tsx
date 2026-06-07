"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash, ExternalLink, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notifications";

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on load and setup polling
  const loadNotifications = async () => {
    const res = await fetchNotifications();
    if (res.success && res.notifications) {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount || 0);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications(); // reload on open
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await markNotificationAsRead(id);
    if (res.success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await markAllNotificationsAsRead();
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markNotificationAsRead(item.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "przed chwilą";
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {/* Bell Icon Button */}
      <button
        onClick={handleToggle}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--nav-text)",
          cursor: "pointer",
          padding: "6px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          opacity: isOpen ? 1 : 0.8,
          transition: "opacity 0.2s"
        }}
        title="Powiadomienia"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "var(--err)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              minWidth: "16px",
              height: "16px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "2px solid var(--nav-bg)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            width: "360px",
            background: "var(--page-bg)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg)"
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>Powiadomienia</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Oznacz wszystkie
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                Brak powiadomień
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--line)",
                    cursor: "pointer",
                    background: n.isRead ? "transparent" : "color-mix(in oklab, var(--accent) 3%, var(--page-bg))",
                    display: "flex",
                    gap: "12px",
                    position: "relative",
                    transition: "background 0.2s"
                  }}
                  className="notification-item"
                >
                  {/* Status Unread Dot */}
                  {!n.isRead && (
                    <span
                      style={{
                        position: "absolute",
                        left: "6px",
                        top: "18px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--accent)"
                      }}
                    />
                  )}

                  {/* Body Content */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ fontWeight: n.isRead ? 500 : 600, fontSize: "13px", color: "var(--text)" }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {n.body}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                      <Calendar size={10} />
                      <span>{formatTimeAgo(n.createdAt)}</span>
                    </div>
                  </div>

                  {/* Single Mark As Read Icon */}
                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                        alignSelf: "center",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex"
                      }}
                      title="Oznacz jako przeczytane"
                      className="mark-read-btn"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
