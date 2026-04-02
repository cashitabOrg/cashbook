import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import SyncEngine from "@/components/SyncEngine";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FrozenPOS - Multi-Tenant Point of Sale",
  description: "SaaS POS, Inventory & Sales Management Platform for Frozen Food Stores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
        <SyncEngine />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

