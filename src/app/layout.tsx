'use client';

import './globals.css';
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./Navbar";
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Bidding Bot - Logistics Management System</title>
        <meta name="description" content="A modern logistics management system for managing shipments and bids" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        {!isAuthPage && <Navbar />}
        <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        {!isAuthPage && (
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="w-full py-4 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Bidding Bot. All rights reserved.
              </p>
            </div>
          </footer>
        )}
      </body>
    </html>
  );
}
