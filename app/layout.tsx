import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import SyncEngine from "@/components/SyncEngine";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { cookies } from "next/headers";
import ImpersonationBanner from "@/components/super-admin/ImpersonationBanner";
import GlobalBroadcastBanner from "@/components/GlobalBroadcastBanner";

// Temporary system font stack to bypass Turbopack Windows crash
const inter = { className: "sans-serif" };

export const metadata: Metadata = {
  title: "Cashitab - Smart POS & Inventory",
  description: "Advanced POS, Inventory & Sales Management Platform for Modern Retail",
  icons: {
    icon: '/logo-icon.png',
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isImpersonating = cookieStore.has("impersonate_store_id");

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <GlobalBroadcastBanner />
        {isImpersonating && <ImpersonationBanner />}
        {children}
        <Toaster position="top-right" richColors />
        <SyncEngine />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
