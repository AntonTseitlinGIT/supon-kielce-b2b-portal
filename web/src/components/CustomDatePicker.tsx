"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from "lucide-react";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  minDate?: string;
}

const MONTH_NAMES_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

const WEEKDAYS_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Wybierz datę...",
  disabled = false,
  id,
  className = "",
  style,
  minDate,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Parsed active view (year, month)
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth() || new Date().getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Update floating popover position relative to button
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 340;
      const popoverHeight = 350;

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - popoverWidth - 16);
      }

      let top = rect.bottom + 8;
      // If bottom overflows viewport, place popover above the input button
      if (top + popoverHeight > window.innerHeight - 16 && rect.top > popoverHeight + 16) {
        top = rect.top - popoverHeight - 8;
      }

      setPopoverPos({ top, left });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);

      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen]);

  // Close popup on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Format string for input button (e.g. 17.08.2026)
  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return dateStr;
    return `${d}.${m}.${y}`;
  };

  // Helper: format YYYY-MM-DD
  const toYYYYMMDD = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  // Calculate days for current viewMonth grid
  const getCalendarDays = () => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1; // 0 = Pn, 6 = Nd
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isDisabled: boolean;
    }> = [];

    // Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const pYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = toYYYYMMDD(pYear, pMonth, pDay);
      days.push({
        day: pDay,
        month: pMonth,
        year: pYear,
        isCurrentMonth: false,
        dateStr,
        isDisabled: minDate ? dateStr < minDate : false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toYYYYMMDD(viewYear, viewMonth, d);
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        dateStr,
        isDisabled: minDate ? dateStr < minDate : false,
      });
    }

    // Next month padding days to fill 42 cells (6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = toYYYYMMDD(nYear, nMonth, d);
      days.push({
        day: d,
        month: nMonth,
        year: nYear,
        isCurrentMonth: false,
        dateStr,
        isDisabled: minDate ? dateStr < minDate : false,
      });
    }

    return days;
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDate = (dateStr: string, isDisabled: boolean) => {
    if (isDisabled || disabled) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleQuickSelect = (daysToAdd: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    const dateStr = toYYYYMMDD(target.getFullYear(), target.getMonth(), target.getDate());
    onChange(dateStr);
    setIsOpen(false);
  };

  const todayStr = toYYYYMMDD(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  return (
    <div
      style={{ position: "relative", width: "100%", ...style }}
      className={`custom-datepicker-container ${className}`}
    >
      {/* Trigger Button Field */}
      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%",
          height: "44px",
          borderRadius: "12px",
          border: "1px solid var(--line)",
          background: "var(--card-bg, #ffffff)",
          color: value ? "var(--text)" : "var(--muted)",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "15px",
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          boxShadow: isOpen ? "0 0 0 3px color-mix(in oklab, var(--accent) 15%, transparent)" : "0 1px 2px rgba(0,0,0,0.02)",
          borderColor: isOpen ? "var(--accent)" : "var(--line)",
          transition: "all 0.2s ease"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CalendarIcon size={18} style={{ color: value ? "var(--accent)" : "var(--muted)", flexShrink: 0 }} />
          <span>{value ? formatDisplay(value) : placeholder}</span>
        </span>

        {value && !disabled ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            style={{
              padding: "4px",
              borderRadius: "50%",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              cursor: "pointer"
            }}
            title="Wyczyść datę"
          >
            <X size={16} />
          </span>
        ) : (
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>
            Zmień
          </span>
        )}
      </button>

      {/* React Portal floating popover calendar (Unclippable) */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Kalendarz wyboru daty"
          style={{
            position: "fixed",
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            zIndex: 999999,
            width: "340px",
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--line)",
            borderRadius: "18px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            padding: "18px",
            animation: "slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Header Month / Year Navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                border: "1px solid var(--line)",
                background: "var(--section-bg)",
                color: "var(--text)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              title="Poprzedni miesiąc"
            >
              <ChevronLeft size={18} />
            </button>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>
                {MONTH_NAMES_PL[viewMonth]} {viewYear}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                border: "1px solid var(--line)",
                background: "var(--section-bg)",
                color: "var(--text)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              title="Następny miesiąc"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekdays Header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "8px", textAlign: "center" }}>
            {WEEKDAYS_PL.map((wd) => (
              <span key={wd} style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "14px" }}>
            {getCalendarDays().map((cell, idx) => {
              const isSelected = cell.dateStr === value;
              const isToday = cell.dateStr === todayStr;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={cell.isDisabled}
                  onClick={() => handleSelectDate(cell.dateStr, cell.isDisabled)}
                  style={{
                    height: "36px",
                    borderRadius: "9px",
                    border: isSelected ? "2px solid var(--accent)" : isToday ? "1px solid var(--accent)" : "1px solid transparent",
                    background: isSelected
                      ? "var(--accent)"
                      : isToday
                      ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                      : "transparent",
                    color: isSelected
                      ? "#ffffff"
                      : !cell.isCurrentMonth
                      ? "var(--muted)"
                      : cell.isDisabled
                      ? "color-mix(in oklab, var(--muted) 40%, transparent)"
                      : "var(--text)",
                    fontWeight: isSelected || isToday ? 800 : cell.isCurrentMonth ? 600 : 400,
                    fontSize: "13.5px",
                    cursor: cell.isDisabled ? "not-allowed" : "pointer",
                    display: "grid",
                    placeItems: "center",
                    transition: "all 0.15s ease"
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Quick Action Bar */}
          <div style={{ display: "flex", gap: "6px", paddingTop: "10px", borderTop: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => handleQuickSelect(0)}
              style={{
                flex: 1,
                height: "32px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                background: "var(--section-bg)",
                color: "var(--text)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px"
              }}
            >
              <Clock size={12} /> Dzisiaj
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(7)}
              style={{
                flex: 1,
                height: "32px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                background: "var(--section-bg)",
                color: "var(--text)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              +7 dni
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(14)}
              style={{
                flex: 1,
                height: "32px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                background: "var(--section-bg)",
                color: "var(--text)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              +14 dni
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
