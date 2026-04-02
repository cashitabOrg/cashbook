"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 4,
  },
  table: {
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  colDate: { width: "15%" },
  colManager: { width: "25%" },
  colProduct: { width: "35%" },
  colQty: { width: "10%", textAlign: "right" },
  colRev: { width: "15%", textAlign: "right", fontWeight: "bold" },
  summaryBox: {
    marginTop: 20,
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  summaryValue: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "heavy",
  }
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

export default function SalesReportPDF({
  storeName,
  period,
  data,
  totalQty,
  totalRevenue,
}: {
  storeName: string;
  period: string;
  data: SaleRecord[];
  totalQty: number;
  totalRevenue: number;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{storeName} - Sales Report</Text>
          <Text style={styles.subtitle}>Reporting Period: {period}</Text>
          <Text style={styles.subtitle}>Generated on: {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.summaryBox}>
          <View>
            <Text style={styles.summaryText}>Total Units Sold</Text>
            <Text style={styles.summaryValue}>{totalQty}</Text>
          </View>
          <View>
            <Text style={styles.summaryText}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₦{totalRevenue.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colManager}>Manager</Text>
            <Text style={styles.colProduct}>Product</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRev}>Revenue</Text>
          </View>

          {data.length === 0 ? (
            <View style={styles.tableRow}>
              <Text>No sales found for this period.</Text>
            </View>
          ) : (
            data.map((row) => (
              <View style={styles.tableRow} key={row.id}>
                <Text style={styles.colDate}>{row.dateStr}</Text>
                <Text style={styles.colManager}>{row.managerName}</Text>
                <Text style={styles.colProduct}>{row.productName}</Text>
                <Text style={styles.colQty}>{row.qty}</Text>
                <Text style={styles.colRev}>₦{row.revenue.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}
