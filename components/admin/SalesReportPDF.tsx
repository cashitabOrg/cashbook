"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#334155",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 6,
    fontWeight: "medium",
  },
  genInfo: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 2,
  },
  summaryBox: {
    marginBottom: 30,
    flexDirection: "row",
    gap: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: "#0f172a",
    fontWeight: "bold",
  },
  revenueValue: {
    color: "#059669",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 25,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  rowEven: {
    backgroundColor: "#ffffff",
  },
  rowOdd: {
    backgroundColor: "#fcfdfe",
  },
  colId: { width: "5%", color: "#94a3b8" },
  colDate: { width: "15%" },
  colTime: { width: "10%", color: "#64748b" },
  colManager: { width: "20%", fontWeight: "medium" },
  colProduct: { width: "30%", fontWeight: "medium", color: "#1e293b" },
  colQty: { width: "10%", textAlign: "right" },
  colRev: { width: "15%", textAlign: "right", fontWeight: "bold", color: "#059669" },
  
  // Performance Styles
  colPerfName: { width: "50%", fontWeight: "bold" },
  colPerfQty: { width: "20%", textAlign: "right" },
  colPerfRev: { width: "30%", textAlign: "right", fontWeight: "bold", color: "#059669" },
});

type SaleRecord = {
  id: string;
  dateStr: string;
  managerName: string;
  productName: string;
  qty: number;
  price: number;
  revenue: number;
};

type PerformanceRecord = {
  name: string;
  qty: number;
  revenue: number;
};

export default function SalesReportPDF({
  storeName,
  period,
  data,
  totalQty,
  totalRevenue,
  performanceSummary,
}: {
  storeName: string;
  period: string;
  data: SaleRecord[];
  totalQty: number;
  totalRevenue: number;
  performanceSummary: PerformanceRecord[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>{storeName}</Text>
          <Text style={styles.subtitle}>Sales Report | {period}</Text>
          <Text style={styles.genInfo}>Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</Text>
        </View>

        {/* High-Level Metrics Section */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Units Sold</Text>
            <Text style={styles.summaryValue}>{totalQty.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Sales Revenue</Text>
            <Text style={[styles.summaryValue, styles.revenueValue]}>NGN {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Business Performance Summary */}
        <Text style={styles.sectionTitle}>Product Performance Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerText, styles.colPerfName]}>Product Name</Text>
            <Text style={[styles.headerText, styles.colPerfQty]}>Qty Sold</Text>
            <Text style={[styles.headerText, styles.colPerfRev]}>Revenue</Text>
          </View>

          {performanceSummary.map((item, index) => (
            <View 
              style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]} 
              key={`perf-${item.name}`}
            >
              <Text style={styles.colPerfName}>{item.name}</Text>
              <Text style={styles.colPerfQty}>{item.qty.toFixed(2)}</Text>
              <Text style={styles.colPerfRev}>NGN {item.revenue.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Granular Sales Log */}
        <Text style={styles.sectionTitle}>Detailed Sales Logs</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerText, styles.colId]}>#</Text>
            <Text style={[styles.headerText, styles.colDate]}>Date</Text>
            <Text style={[styles.headerText, styles.colManager]}>Manager</Text>
            <Text style={[styles.headerText, styles.colProduct]}>Product</Text>
            <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
            <Text style={[styles.headerText, styles.colRev]}>Revenue</Text>
          </View>

          {data.length === 0 ? (
            <View style={styles.tableRow}>
              <Text>No sale records found for the selected period.</Text>
            </View>
          ) : (
            data.map((row, index) => (
              <View 
                style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]} 
                key={row.id}
              >
                <Text style={styles.colId}>{index + 1}</Text>
                <Text style={styles.colDate}>{row.dateStr}</Text>
                <Text style={styles.colManager}>{row.managerName}</Text>
                <Text style={styles.colProduct}>{row.productName}</Text>
                <Text style={styles.colQty}>{row.qty.toFixed(2)}</Text>
                <Text style={styles.colRev}>NGN {row.revenue.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}
