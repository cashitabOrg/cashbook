import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import SyncEngine from "@/components/SyncEngine";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { cookies } from "next/headers";
import ImpersonationBanner from "@/components/super-admin/ImpersonationBanner";
import GlobalBroadcastBanner from "@/components/GlobalBroadcastBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import PwaSplashScreen from "@/components/PwaSplashScreen";

// Temporary system font stack to bypass Turbopack Windows crash
const inter = { className: "sans-serif" };

export const metadata: Metadata = {
  title: "Cashitab - Smart POS & Inventory",
  description: "Advanced POS, Inventory & Sales Management Platform for Modern Retail",
  manifest: "/manifest.json",
  icons: {
    icon: '/Logo_cashitab.png',
    shortcut: '/Logo_cashitab.png',
    apple: '/Logo_cashitab.png',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPrompt = e;
                window.dispatchEvent(new CustomEvent('pwa-install-prompt-available'));
              });
            `
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PwaSplashScreen />
          <GlobalBroadcastBanner />
          {isImpersonating && <ImpersonationBanner />}
          {children}
          <Toaster position="top-right" richColors />
          <SyncEngine />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
