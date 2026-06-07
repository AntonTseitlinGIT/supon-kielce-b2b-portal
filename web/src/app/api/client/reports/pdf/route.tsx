import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import React from "react";
import { Page, Text, View, Document, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

// Define PDF styles
const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontFamily: "Helvetica", 
    fontSize: 10, 
    color: "#334155" 
  },
  header: { 
    borderBottomWidth: 2, 
    borderBottomColor: "#2c6bed", 
    paddingBottom: 12, 
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  logoSection: {
    flexDirection: "column"
  },
  companyName: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#2c6bed" 
  },
  title: { 
    fontSize: 11, 
    color: "#64748b",
    marginTop: 4
  },
  dateSection: {
    alignItems: "flex-end"
  },
  dateText: { 
    fontSize: 9, 
    color: "#64748b" 
  },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: "bold", 
    borderBottomWidth: 1, 
    borderBottomColor: "#cbd5e1", 
    paddingBottom: 4, 
    marginBottom: 10, 
    color: "#0f172a",
    marginTop: 15
  },
  kpisContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 24,
    marginTop: 10
  },
  kpiBox: { 
    width: "23%", 
    padding: 12, 
    backgroundColor: "#f8fafc", 
    borderWidth: 1, 
    borderColor: "#e2e8f0", 
    borderRadius: 6 
  },
  kpiTitle: { 
    fontSize: 8, 
    color: "#64748b", 
    fontWeight: "bold"
  },
  kpiValue: { 
    fontSize: 13, 
    fontWeight: "bold", 
    color: "#0f172a", 
    marginTop: 4 
  },
  table: { 
    width: "100%", 
    marginBottom: 20 
  },
  tableRow: { 
    flexDirection: "row", 
    borderBottomWidth: 1, 
    borderBottomColor: "#f1f5f9", 
    paddingVertical: 8, 
    alignItems: "center" 
  },
  tableHeader: { 
    backgroundColor: "#f8fafc", 
    borderBottomWidth: 1.5,
    borderBottomColor: "#cbd5e1",
    fontWeight: "bold"
  },
  colName: { width: "25%", fontWeight: "bold" },
  colAddress: { width: "35%", color: "#64748b" },
  colEmployees: { width: "13%", textAlign: "center" },
  colOrders: { width: "12%", textAlign: "center" },
  colSpend: { width: "15%", textAlign: "right", fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    alignItems: "center"
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8"
  }
});

interface BranchRow {
  name: string;
  address: string;
  employeeCount: number;
  orderCount: number;
  totalSpend: number;
}

interface PdfData {
  companyName: string;
  nip: string;
  totalSpent: number;
  totalOrders: number;
  totalEmployees: number;
  activeTickets: number;
  branches: BranchRow[];
}

// React-PDF Document Component
const ReportPdfDocument = ({ data }: { data: PdfData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Text style={styles.companyName}>SUPON Kielce</Text>
          <Text style={styles.title}>Raport wydatków i ŚOI dla: {data.companyName}</Text>
        </View>
        <View style={styles.dateSection}>
          <Text style={styles.dateText}>NIP: {data.nip}</Text>
          <Text style={styles.dateText}>Wygenerowano: {new Date().toLocaleDateString("pl-PL")}</Text>
        </View>
      </View>

      {/* KPI Overview */}
      <Text style={styles.sectionTitle}>Podsumowanie finansowe i ilościowe</Text>
      <View style={styles.kpisContainer}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>WYDATKI (PLN)</Text>
          <Text style={styles.kpiValue}>{data.totalSpent.toFixed(2)}</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>ZAMÓWIENIA</Text>
          <Text style={styles.kpiValue}>{data.totalOrders}</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>PRACOWNICY</Text>
          <Text style={styles.kpiValue}>{data.totalEmployees}</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>ZGŁOSZENIA</Text>
          <Text style={styles.kpiValue}>{data.activeTickets}</Text>
        </View>
      </View>

      {/* Branches Table */}
      <Text style={styles.sectionTitle}>Zestawienie wydatków oddziałów</Text>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.colName}>Nazwa oddziału</Text>
          <Text style={styles.colAddress}>Adres dostaw</Text>
          <Text style={styles.colEmployees}>Pracownicy</Text>
          <Text style={styles.colOrders}>Zamówienia</Text>
          <Text style={styles.colSpend}>Wydatki</Text>
        </View>
        
        {/* Table Rows */}
        {data.branches.map((b, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colName}>{b.name}</Text>
            <Text style={styles.colAddress}>{b.address}</Text>
            <Text style={styles.colEmployees}>{b.employeeCount}</Text>
            <Text style={styles.colOrders}>{b.orderCount}</Text>
            <Text style={styles.colSpend}>{b.totalSpend.toFixed(2)} PLN</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Generowane automatycznie przez Portal Klienta SUPON Kielce. © 2026 SUPON Kielce S.A.
        </Text>
      </View>

    </Page>
  </Document>
);

function getFallbackPrice(categoryName: string) {
  const cat = categoryName.toLowerCase();
  if (cat.includes("obuwie") || cat.includes("buty")) return 150.00;
  if (cat.includes("odzież") || cat.includes("ubranie")) return 95.00;
  if (cat.includes("rękawic")) return 12.50;
  if (cat.includes("głow") || cat.includes("kask")) return 45.00;
  return 50.00;
}

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "CLIENT_HEAD" || !session.user.clientId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const clientId = session.user.clientId;

  try {
    // 1. Fetch Client Details
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return new NextResponse("Client not found", { status: 404 });
    }

    // 2. Fetch prices map
    const clientProducts = await prisma.clientProduct.findMany({
      where: { clientId },
      select: { productId: true, customPrice: true }
    });
    const priceMap = new Map<string, number>();
    clientProducts.forEach(cp => {
      if (cp.customPrice) {
        priceMap.set(cp.productId, Number(cp.customPrice));
      }
    });

    // 3. Fetch branches
    const branches = await prisma.branch.findMany({
      where: { clientId },
      include: {
        _count: {
          select: { employees: true, orders: true }
        }
      }
    });

    // 4. Fetch orders
    const orders = await prisma.order.findMany({
      where: { clientId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        },
        branch: true
      }
    });

    // 5. Active tickets and employees
    const activeTickets = await prisma.ticket.count({
      where: { clientId, status: { in: ["NEW", "IN_PROGRESS"] } }
    });

    const totalEmployees = await prisma.employee.count({
      where: { branch: { clientId }, status: "ACTIVE" }
    });

    // Calculations
    const getValuation = (productId: string, qty: number, categoryName: string) => {
      const unitPrice = priceMap.get(productId) || getFallbackPrice(categoryName);
      return unitPrice * qty;
    };

    let totalSpent = 0;
    const branchSpendMap = new Map<string, number>();
    const branchOrderCountMap = new Map<string, number>();

    orders.forEach((order) => {
      const branchName = order.branch.name;
      let orderValue = 0;

      order.items.forEach((item) => {
        orderValue += getValuation(item.productId, item.quantity, item.product.category.name);
      });

      if (order.status !== "CANCELLED") {
        totalSpent += orderValue;
        branchSpendMap.set(branchName, (branchSpendMap.get(branchName) || 0) + orderValue);
      }
      branchOrderCountMap.set(branchName, (branchOrderCountMap.get(branchName) || 0) + 1);
    });

    const branchesTable: BranchRow[] = branches.map((b) => ({
      name: b.name,
      address: b.address,
      employeeCount: b._count.employees,
      orderCount: branchOrderCountMap.get(b.name) || 0,
      totalSpend: branchSpendMap.get(b.name) || 0,
    }));

    const pdfData: PdfData = {
      companyName: client.name,
      nip: client.nip,
      totalSpent,
      totalOrders: orders.length,
      totalEmployees,
      activeTickets,
      branches: branchesTable,
    };

    // Render PDF Document to Buffer
    const pdfBuffer = await renderToBuffer(<ReportPdfDocument data={pdfData} />);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="raport_supon_${clientId}.pdf"`,
      },
    });

  } catch (err: any) {
    console.error("Error generating report PDF:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
