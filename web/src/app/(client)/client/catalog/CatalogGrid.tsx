"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, PackageOpen, HelpCircle } from "lucide-react";
import styles from "./catalog.module.css";

interface Product {
  id: string;
  articleNr: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  photoUrls: string[];
  availableSizes: string[];
}

interface CatalogGridProps {
  products: Product[];
  categories: { id: string; name: string }[];
}

export default function CatalogGrid({ products, categories }: CatalogGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter products based on search term & category selection
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.articleNr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.container}>
      
      {/* Search and filter controls */}
      <div className={styles.filterBar}>
        
        {/* Search Input */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Szukaj po nazwie, opisie lub kodzie artykułu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories Pills */}
        <div className={styles.categoriesList}>
          <button
            className={`${styles.categoryBtn} ${!selectedCategory ? styles.categoryBtnActive : ""}`}
            onClick={() => setSelectedCategory(null)}
          >
            Wszystkie
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.categoryBtn} ${selectedCategory === cat.id ? styles.categoryBtnActive : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

      </div>

      {/* Grid of Product Cards */}
      {filteredProducts.length > 0 ? (
        <div className={styles.grid}>
          {filteredProducts.map((p) => (
            <div key={p.id} className={styles.card}>
              
              {/* Product Photo or Icon representation */}
              <div className={styles.imgPlaceholder}>
                <PackageOpen size={48} />
                <span style={{ fontSize: "12px", fontWeight: 600 }}>SUPON Kielce</span>
              </div>

              {/* Card info contents */}
              <div className={styles.cardContent}>
                <span className={styles.categoryBadge}>{p.categoryName}</span>
                
                <h3 className={styles.productName}>{p.name}</h3>
                <span className={styles.artNr}>Kod: {p.articleNr}</span>

                <p className={styles.description} title={p.description || ""}>
                  {p.description || "Brak opisu produktu."}
                </p>

                {/* Available Sizes list */}
                <div className={styles.sizesSection}>
                  <div className={styles.sizesLabel}>Dostępne rozmiary:</div>
                  <div className={styles.sizesList}>
                    {p.availableSizes.map((s) => (
                      <span key={s} className={styles.sizeTag}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Submit button wrapper */}
                <Link href={`/client/orders/new?productId=${p.id}`}>
                  <button className={styles.btnOrder}>
                    <ShoppingBag size={16} /> Zamów ten produkt
                  </button>
                </Link>

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <HelpCircle size={48} style={{ marginBottom: "12px", opacity: 0.5 }} />
          <h3>Nie znaleziono pasujących produktów</h3>
          <p>Spróbuj zmienić parametry wyszukiwania lub wybraną kategorię.</p>
        </div>
      )}

    </div>
  );
}
