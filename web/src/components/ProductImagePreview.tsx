"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";

interface ProductImagePreviewProps {
  src: string;
  alt: string;
  size?: number; // Thumbnail size in px (e.g. 44)
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ProductImagePreview({
  src,
  alt,
  size = 44,
  borderRadius = "10px",
  className = "",
  style,
}: ProductImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!src) return null;

  return (
    <>
      {/* Thumbnail Trigger Container */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            setIsOpen(true);
          }
        }}
        title="Kliknij, aby powiększyć zdjęcie produktu"
        className={`product-thumb-trigger ${className}`}
        style={{
          position: "relative",
          width: `${size}px`,
          height: `${size}px`,
          borderRadius,
          background: "var(--section-bg)",
          overflow: "hidden",
          cursor: "pointer",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow-xs)",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          ...style,
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease",
          }}
        />

        {/* Hover overlay with zoom icon */}
        <div
          className="zoom-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.35)",
            color: "#ffffff",
            display: "grid",
            placeItems: "center",
            opacity: 0,
            transition: "opacity 0.2s ease",
          }}
        >
          <ZoomIn size={Math.max(14, Math.floor(size * 0.4))} />
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Powiększone zdjęcie: ${alt}`}
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            animation: "fadeIn 0.2s ease forwards",
            cursor: "zoom-out",
          }}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            aria-label="Zamknij podgląd"
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              transition: "background 0.2s ease, transform 0.2s ease",
            }}
          >
            <X size={22} />
          </button>

          {/* Large Image Box */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "default",
            }}
          >
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: "16px",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                background: "#ffffff",
              }}
            />

            {alt && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px 20px",
                  borderRadius: "99px",
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(8px)",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  textAlign: "center",
                  maxWidth: "90vw",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                {alt}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <style jsx global>{`
        .product-thumb-trigger:hover .zoom-overlay {
          opacity: 1 !important;
        }
        .product-thumb-trigger:hover {
          transform: scale(1.08);
          border-color: var(--accent) !important;
          box-shadow: 0 4px 12px color-mix(in oklab, var(--accent) 30%, transparent) !important;
        }
      `}</style>
    </>
  );
}
