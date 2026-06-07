"use client";

import React, { useState, useTransition } from "react";
import { Package, Search, Plus, Edit2, AlertCircle, CheckCircle } from "lucide-react";
import { createProduct, updateProduct } from "./actions";

interface ProductData {
  id: string;
  articleNr: string;
  name: string;
  categoryId: string;
  description: string | null;
  availableSizes: string[];
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
}

interface CategoryData {
  id: string;
  name: string;
}

interface CatalogClientProps {
  products: ProductData[];
  categories: CategoryData[];
}

export default function CatalogClient({ products, categories }: CatalogClientProps) {
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [mode, setMode] = useState<"add" | "edit">("add");
  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [articleNr, setArticleNr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [availableSizes, setAvailableSizes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleEditClick = (p: ProductData) => {
    setMode("edit");
    setProductId(p.id);
    setName(p.name);
    setArticleNr(p.articleNr);
    setCategoryId(p.categoryId);
    setDescription(p.description || "");
    setAvailableSizes(p.availableSizes.join(", "));
    setIsActive(p.isActive);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleReset = () => {
    setMode("add");
    setProductId("");
    setName("");
    setArticleNr("");
    setCategoryId(categories[0]?.id || "");
    setDescription("");
    setAvailableSizes("");
    setIsActive(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) { setErrorMsg("Nazwa towaru jest wymagana."); return; }
    if (!articleNr.trim()) { setErrorMsg("Numer artykułu (kod) jest wymagany."); return; }
    if (!categoryId) { setErrorMsg("Wybierz kategorię ŚOI."); return; }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("articleNr", articleNr);
    formData.append("categoryId", categoryId);
    formData.append("description", description);
    formData.append("availableSizes", availableSizes);

    startTransition(async () => {
      let result;
      if (mode === "add") {
        result = await createProduct(null, formData);
      } else {
        formData.append("id", productId);
        formData.append("isActive", isActive.toString());
        result = await updateProduct(null, formData);
      }

      if (result.success) {
        setSuccessMsg(result.message || "Produkt został zapisany!");
        if (mode === "add") {
          setName(""); setArticleNr(""); setDescription(""); setAvailableSizes("");
        } else {
          handleReset();
        }
      } else {
        setErrorMsg(result.error || "Wystąpił błąd zapisu.");
      }
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.articleNr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>

      {/* Product List */}
      <div className="card">
        <div className="card-header" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Package size={20} className="muted" /> Katalog produktów ({filteredProducts.length})
          </h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              className="form-input"
              style={{ width: "160px", height: "36px", fontSize: "13px", padding: "0 10px" }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Wszystkie kategorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div style={{ position: "relative", width: "220px" }}>
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}>
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: "32px", height: "36px", fontSize: "13px" }}
                placeholder="Szukaj towaru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nazwa i Kod artykułu</th>
                <th>Kategoria</th>
                <th>Rozmiary</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "right" }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    Brak produktów w katalogu.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>Kod: <code>{p.articleNr}</code></span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: "var(--section-bg)", color: "var(--text)", fontSize: "12px" }}>
                        {p.category.name}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.availableSizes.join(", ")}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${p.isActive ? "ok" : "err"}`} style={{ fontSize: "12px" }}>
                        {p.isActive ? "Aktywny" : "Zablokowany"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditClick(p)}
                      >
                        Edytuj
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor / Form Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            {mode === "add" ? (
              <><Plus size={18} style={{ color: "var(--accent)" }} /> Dodaj towar</>
            ) : (
              <><Edit2 size={18} style={{ color: "var(--accent)" }} /> Edytuj towar</>
            )}
          </h3>
        </div>
        <div className="card-content">
          {errorMsg && (
            <div style={{ display: "flex", gap: "8px", background: "color-mix(in oklab, var(--err) 12%, var(--page-bg))", border: "1px solid var(--err)", padding: "10px 14px", borderRadius: "10px", color: "var(--err)", marginBottom: "16px", fontSize: "13px" }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div style={{ display: "flex", gap: "8px", background: "color-mix(in oklab, var(--ok) 12%, var(--page-bg))", border: "1px solid var(--ok)", padding: "10px 14px", borderRadius: "10px", color: "var(--ok)", marginBottom: "16px", fontSize: "13px" }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label form-required">Nazwa artykułu</label>
              <input type="text" className="form-input" placeholder="np. Buty robocze S1" required value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
            </div>
            <div className="form-group">
              <label className="form-label form-required">Numer artykułu (Kod)</label>
              <input type="text" className="form-input" placeholder="np. BHP-BUT-091" required value={articleNr} onChange={(e) => setArticleNr(e.target.value)} disabled={isPending} />
            </div>
            <div className="form-group">
              <label className="form-label form-required">Kategoria ŚOI</label>
              <select className="form-input" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={isPending}>
                <option value="" disabled>Wybierz kategorię...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Dostępne rozmiary</label>
              <input type="text" className="form-input" placeholder="np. S, M, L, XL lub 41, 42, 43" value={availableSizes} onChange={(e) => setAvailableSizes(e.target.value)} disabled={isPending} />
              <span style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                Rozdziel wartości przecinkami. Pozostaw puste dla towarów bezrozmiarowych.
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Opis towaru</label>
              <textarea className="form-textarea" rows={3} placeholder="Szczegółowy opis specyfikacji produktu..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} />
            </div>
            {mode === "edit" && (
              <div className="switch-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--line)" }}>
                <span className="form-label" style={{ margin: 0 }}>Artykuł aktywny</span>
                <label className="switch">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isPending} />
                  <span className="slider"></span>
                </label>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              {mode === "edit" && (
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleReset} disabled={isPending}>
                  Anuluj
                </button>
              )}
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isPending}>
                {isPending ? "Zapisywanie..." : mode === "add" ? "Dodaj towar" : "Zapisz zmiany"}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
