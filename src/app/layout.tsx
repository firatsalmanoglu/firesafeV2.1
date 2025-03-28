// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FireSafe Management Dashboard",
  description: "Next.js School Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </SessionProvider>
  );
}