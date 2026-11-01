'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function BlogHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Pill */}
          <div className="flex items-center gap-3">
            <Link href="/blog" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="Holy Buds"
                width={170}
                height={48}
                priority
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              Journal
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
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
              href="/faq"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Actions: Shop Now Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
            >
              <span>Shop Now</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
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
          <div className="lg:hidden py-4 border-t border-slate-200 space-y-2 bg-white animate-fade-in">
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
