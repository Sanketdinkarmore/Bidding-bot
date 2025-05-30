"use client";
import Image from 'next/image';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex flex-1">
              <div className="flex-shrink-0 flex items-center gap-x-2">
                <Image  src="/agarwal-packers-logo.png" width={50} height={50} alt='logo' />
                <Link href="/" className="text-xl font-bold text-blue-600">
                  Apml Bidding Bot
                </Link>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:flex-1 sm:justify-center sm:space-x-12">
                <Link
                  href="/"
                  className={`${pathname === '/' ? 'border-b-2 border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/view-shipments"
                  className={`${pathname.startsWith('/view-shipments') ? 'border-b-2 border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium`}
                >
                  Shipments
                </Link>
                <Link
                  href="/bidding-details"
                  className={`${pathname.startsWith('/bidding-details') ? 'border-b-2 border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium`}
                >
                  Bidding Details
                </Link>
                <Link
                  href="/create-shipment"
                  className={`${pathname.startsWith('/create-shipment') ? 'border-b-2 border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium`}
                >
                  Create Shipment Bids
                </Link>
              </div>
            </div>
            <div className="flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
            <div className="hidden sm:flex sm:items-center sm:ml-6">
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="View notifications"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile Navigation */}
      <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`${pathname === '/' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/view-shipments"
            className={`${pathname.startsWith('/view-shipments') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            View Shipments
          </Link>
          <Link
            href="/bidding-details"
            className={`${pathname.startsWith('/bidding-details') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Bidding Details
          </Link>
          <Link
            href="/create-shipment"
            className={`${pathname.startsWith('/create-shipment') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Create Shipment Bids
          </Link>
        </div>
      </div>
    </>
  );
} 