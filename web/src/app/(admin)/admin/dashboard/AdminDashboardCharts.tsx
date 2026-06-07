"use client";

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#64748b"];

interface ClientSpendItem {
  clientName: string;
  spend: number;
}

interface StatusItem {
  name: string;
  value: number;
}

interface AdminDashboardChartsProps {
  clientSpendData: ClientSpendItem[];
  statusData: StatusItem[];
}

export default function AdminDashboardCharts({
  clientSpendData,
  statusData
}: AdminDashboardChartsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginBottom: "32px" }}>
      {/* Chart 1: Spend per Client */}
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "var(--text)" }}>
          Wydatki według klientów (PLN)
        </h3>
        <div style={{ height: "260px", width: "100%" }}>
          {clientSpendData.length === 0 ? (
            <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: "14px" }}>
              Brak danych do wyświetlenia
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientSpendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="clientName" stroke="var(--muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--page-bg)", border: "1px solid var(--line)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--text)", fontWeight: 600 }}
                />
                <Bar dataKey="spend" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Wydatki" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Order Statuses */}
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "var(--text)" }}>
          Statusy zamówień
        </h3>
        <div style={{ height: "260px", width: "100%" }}>
          {statusData.length === 0 ? (
            <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: "14px" }}>
              Brak danych do wyświetlenia
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--page-bg)", border: "1px solid var(--line)", borderRadius: "8px" }}
                />
                <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "12px", color: "var(--text)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
