import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastViewport from "@/components/ui/ToastViewport";
import CookieBanner from "@/components/ui/CookieBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000';

export const metadata: Metadata = {
  title: {
    // Individual pages set their own title; this is the fallback.
    default: 'VBucks Shop',
    // Pages that set `title: 'Item Shop'` will render as "Item Shop · VBucks Shop".
    template: '%s · VBucks Shop',
  },
  description: 'Buy V-Bucks and spend them on Fortnite skins.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    siteName: 'VBucks Shop',
    type: 'website',
    locale: 'bg_BG',
  },
  twitter: {
    card: 'summary',
  },
  robots: {
    // Let the robots.ts file handle the per-route allow/disallow rules;
    // this just ensures the global default is "index and follow".
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <ToastProvider>
            <CartProvider>{children}</CartProvider>
            <ToastViewport />
          </ToastProvider>
          <CookieBanner />
        </body>
      </html>
    </ClerkProvider>
  );
}
