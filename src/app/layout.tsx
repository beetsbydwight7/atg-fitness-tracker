import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DatabaseProvider } from "@/components/layout/DatabaseProvider";
import { BottomNav } from "@/components/layout/BottomNav";

const geistSans = localFont({
  src: "../../public/fonts/geist.woff2",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../../public/fonts/geist-mono.woff2",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "ATG Fitness Tracker",
  description: "Track your Athletic Truth Group and Knees Over Toes workouts with full exercise support, PR detection, and progress charts.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DatabaseProvider>
          <main className="flex-1 pb-16">{children}</main>
          <BottomNav />
        </DatabaseProvider>
      </body>
    </html>
  );
}
