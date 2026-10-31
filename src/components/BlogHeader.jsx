'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StoreHoursBadge from './StoreHoursBadge';
import { getStoreHoursStatus } from '@/lib/operatingHours';

export default function BlogHeader() {
  const [storeStatus, setStoreStatus] = useState(getStoreHoursStatus());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setStoreStatus(getStoreHoursStatus());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Pill */}
          <div className="flex items-center gap-3">
            <Link href="/blog" className="flex items-center gap-2.5 group">
              <div className="bg-[#0b1410] px-3 py-1.5 rounded-xl border border-emerald-900/40 shadow-xs group-hover:border-emerald-500/50 transition-all flex items-center">
                <Image
                  src="/logo.png"
                  alt="Holy Buds"
                  width={240}
                  height={60}
                  priority
                  className="h-7 w-auto object-contain"
                />
              </div>
            </Link>

            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              Journal
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/blog"
              className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/blog#categories"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Topics
            </Link>
            <Link
              href="/blog#latest"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Latest Guides
            </Link>
            <Link
              href="/menu"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
            >
              Shop Menu
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </Link>
            <Link
              href="/faq"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Actions & Live Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <StoreHoursBadge status={storeStatus} />
            </div>

            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span>Order Delivery</span>
            </Link>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 space-y-3 bg-white animate-fade-in">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Status</span>
              <StoreHoursBadge status={storeStatus} />
            </div>

            <div className="flex flex-col space-y-1">
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-bold text-slate-900 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                Blog Home
              </Link>
              <Link
                href="/blog#categories"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Topics &amp; Categories
              </Link>
              <Link
                href="/blog#latest"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Latest Guides
              </Link>
              <Link
                href="/menu"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between"
              >
                <span>Shop Weed Menu</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Store</span>
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                FAQ &amp; Delivery Info
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

