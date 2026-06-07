"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import styles from "./reports.module.css";

// Harmonized colors matching the CSS theme variables
const COLORS = ["#4f46e5", "#818cf8", "#06a77d", "#f59e0b", "#0ea5e9", "#ef4444"];

interface KPIInfo {
  totalSpent: number;
  totalOrders: number;
  totalEmployees: number;
  activeTickets: number;
}

interface BranchChartItem {
  name: string;
  spend: number;
  orders: number;
}

interface MonthlyChartItem {
  month: string;
  count: number;
}

interface DistributionChartItem {
  name: string;
  value: number;
}

interface BranchTableItem {
  name: string;
  address: string;
  employeeCount: number;
  orderCount: number;
  totalSpend: number;
}

interface ReportsDashboardProps {
  kpis: KPIInfo;
  branchChartData: BranchChartItem[];
  monthlyChartData: MonthlyChartItem[];
  statusChartData: DistributionChartItem[];
  categoryChartData: DistributionChartItem[];
  branchesTable: BranchTableItem[];
}

export default function ReportsDashboard({
  kpis,
  branchChartData,
  monthlyChartData,
  statusChartData,
  categoryChartData,
  branchesTable,
}: ReportsDashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [isPdfPending, startPdfTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportExcel = () => {
    const wsData = branchesTable.map(b => ({
      "Nazwa oddziału": b.name,
      "Adres": b.address,
      "Liczba pracowników": b.employeeCount,
      "Liczba zamówień": b.orderCount,
      "Łączne wydatki (PLN)": b.totalSpend,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statystyki Oddziałów");

    // Format column widths
    ws["!cols"] = [
      { wch: 25 },
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 }
    ];

    XLSX.writeFile(wb, "raport_wydatkow_supon.xlsx");
  };

  const handleExportPdf = () => {
    startPdfTransition(async () => {
      // Trigger browser to open endpoint directly
      window.open("/api/client/reports/pdf", "_blank");
    });
  };

  if (!mounted) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--muted)" }}>
        <Loader2 size={36} className="spinner" />
        <span style={{ marginLeft: "12px", fontWeight: 600 }}>Ładowanie wykresów i statystyk...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* Export Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
        <div className={styles.exportButtons}>
          <button 
            onClick={handleExportExcel} 
            className={`${styles.btnExport} ${styles.btnExportExcel}`}
          >
            <FileSpreadsheet size={16} /> Eksportuj do Excel (XLSX)
          </button>
          
          <button 
            onClick={handleExportPdf} 
            className={`${styles.btnExport} ${styles.btnExportPdf} ${isPdfPending ? styles.btnExportDisabled : ""}`}
            disabled={isPdfPending}
          >
            {isPdfPending ? (
              <>
                <Loader2 size={16} className="spinner" /> Generowanie PDF...
              </>
            ) : (
              <>
                <FileText size={16} /> Pobierz raport PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpisGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Łączne wydatki</span>
          <span className={styles.kpiValue}>{kpis.totalSpent.toFixed(2)} PLN</span>
          <span className={styles.kpiFooter}>Na podstawie zrealizowanych pozycji</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Liczba zamówień</span>
          <span className={styles.kpiValue}>{kpis.totalOrders}</span>
          <span className={styles.kpiFooter}>Wszystkie złożone zamówienia</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Zarejestrowani pracownicy</span>
          <span className={styles.kpiValue}>{kpis.totalEmployees}</span>
          <span className={styles.kpiFooter}>Aktywne profile pracowników</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Aktywne zgłoszenia</span>
          <span className={styles.kpiValue}>{kpis.activeTickets}</span>
          <span className={styles.kpiFooter}>Otwarte reklamacje i wymiany</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        
        {/* Chart 1: Expenses per Branch */}
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>Wydatki według oddziałów (PLN)</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "var(--page-bg)", border: "1px solid var(--line)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--text)", fontWeight: 600 }}
                />
                <Bar dataKey="spend" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Suma wydatków" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly orders frequency */}
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>Częstotliwość zamówień (miesięcznie)</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "var(--page-bg)", border: "1px solid var(--line)", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Liczba zamówień" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Order status distribution */}
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>Struktura statusów zamówień</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${percent !== undefined ? (percent * 100).toFixed(0) : 0}%)`}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Categories distribution */}
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>Zamówienia według kategorii ŚOI</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} (${percent !== undefined ? (percent * 100).toFixed(0) : 0}%)`}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Summary Table Section */}
      <div className={styles.tableSection}>
        <h4 className={styles.chartTitle} style={{ marginBottom: "16px" }}>Zestawienie wydatków oddziałów</h4>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Oddział</th>
                <th>Adres dostaw</th>
                <th style={{ textAlign: "center" }}>Liczba pracowników</th>
                <th style={{ textAlign: "center" }}>Złożone zamówienia</th>
                <th style={{ textAlign: "right" }}>Łączny koszt (PLN)</th>
              </tr>
            </thead>
            <tbody>
              {branchesTable.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td style={{ color: "var(--muted)", fontSize: "13px" }}>{row.address}</td>
                  <td style={{ textAlign: "center", fontWeight: 500 }}>{row.employeeCount}</td>
                  <td style={{ textAlign: "center", fontWeight: 500 }}>{row.orderCount}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--accent)" }}>
                    {row.totalSpend.toFixed(2)} PLN
                  </td>
                </tr>
              ))}
              {branchesTable.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                    Brak danych oddziałów dla tego klienta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
