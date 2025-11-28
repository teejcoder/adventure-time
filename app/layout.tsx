import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Adventure Time | Cheapest Flight Finder",
  description: "Find the absolute cheapest flights between any two airports instantly. No hidden fees, just the best prices.",
  keywords: ["flights", "cheap flights", "travel", "adventure", "flight search", "budget travel"],
  authors: [{ name: "Adventure Time Team" }],
  openGraph: {
    title: "Adventure Time | Cheapest Flight Finder",
    description: "Find the absolute cheapest flights between any two airports instantly.",
    url: "https://adventure-time-flights.vercel.app",
    siteName: "Adventure Time",
    images: [
      {
        url: "/public/logo.png",
        width: 800,
        height: 600,
        alt: "Adventure Time Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adventure Time | Cheapest Flight Finder",
    description: "Find the absolute cheapest flights between any two airports instantly.",
    images: ["/public/logo.png"],
  },
  icons: {
    icon: "/public/logo.svg",
    shortcut: "favicon.ico",
    apple: "/public/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
