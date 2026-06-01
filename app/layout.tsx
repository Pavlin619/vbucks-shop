import type { Metadata } from "next";
import { headers } from "next/headers";
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

export const metadata: Metadata = {
  metadataBase: new URL('https://promociika.com'),
  title: {
    default: 'Promociika — Fortnite V-Bucks & Skins',
    template: '%s | Promociika',
  },
  description:
    'Купи V-Bucks с реални пари и ги похарчи за Fortnite скинове. Бърза доставка, сигурно плащане.',
  keywords: ['V-Bucks', 'Fortnite', 'скинове', 'Fortnite shop', 'Promociika', 'VBucks Shop'],
  openGraph: {
    type: 'website',
    locale: 'bg_BG',
    url: 'https://promociika.com',
    siteName: 'Promociika',
    title: 'Promociika — Fortnite V-Bucks & Skins',
    description:
      'Купи V-Bucks с реални пари и ги похарчи за Fortnite скинове. Бърза доставка, сигурно плащане.',
    images: [
      {
        url: '/vbucks-coin.jpg',
        alt: 'Promociika — Fortnite V-Bucks Shop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Promociika — Fortnite V-Bucks & Skins',
    description:
      'Купи V-Bucks с реални пари и ги похарчи за Fortnite скинове. Бърза доставка, сигурно плащане.',
    images: ['/vbucks-coin.jpg'],
  },
  icons: {
    icon: '/vbucks-coin.jpg',
    apple: '/vbucks-coin.jpg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  return (
    <ClerkProvider nonce={nonce}>
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
